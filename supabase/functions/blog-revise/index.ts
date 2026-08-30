import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

async function requireAdmin(req: Request): Promise<{ userId: string } | Response> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return jsonResponse({ error: "No autorizado" }, 401);
  }
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceKey) {
    return jsonResponse({ error: "Falta configuración de Supabase" }, 500);
  }
  const client = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user) return jsonResponse({ error: "Sesión inválida" }, 401);

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || profile.role !== "admin") {
    return jsonResponse({ error: "Acceso denegado: se requiere rol admin" }, 403);
  }
  return { userId: user.id };
}

async function deepseekJson<T>(system: string, user: string, maxTokens = 2048): Promise<T> {
  const apiKey = Deno.env.get("DEEPSEEK_API_KEY");
  if (!apiKey) throw new Error("Falta DEEPSEEK_API_KEY");
  const model = Deno.env.get("DEEPSEEK_MODEL") ?? "deepseek-v4-flash";
  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.5,
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  const raw = await res.text();
  if (!res.ok) throw new Error(`DeepSeek (${res.status}): ${raw.slice(0, 500)}`);
  let content = "";
  try {
    content = JSON.parse(raw)?.choices?.[0]?.message?.content ?? "";
  } catch {
    throw new Error(`Respuesta inválida de DeepSeek: ${raw.slice(0, 500)}`);
  }
  if (!content) throw new Error("DeepSeek respondió sin contenido.");
  const cleaned = content
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new Error(`DeepSeek no devolvió JSON válido: ${cleaned.slice(0, 500)}`);
  }
}

const SYSTEM_REVISER = `
Sos el revisor de un blog técnico en español rioplatense. Recibís un borrador y una
lista de problemas que señaló el crítico.

Aplicá SOLO esos problemas: cambiá puntualmente lo que indican, preservando el resto
del contenido tal cual salvo que el problema indique lo contrario.
Si hay un problema de extensión, ajustá la longitud del post al target de palabras
indicado (expandí con contenido útil y on-topic, o recortá lo redundante).
Respetá el estilo: hook al inicio, párrafos cortos, voz activa, markdown con ## y
código con \`\`\` si corresponde. No inventes fechas, versiones ni cifras.

Devolvé ÚNICAMENTE un objeto JSON (sin texto adicional, sin bloques de código markdown)
con esta forma exacta:
{
  "title": string,
  "categories": string[],
  "description": string,
  "bodyMarkdown": string
}
`;

interface Borrador {
  title: string;
  categories: string[];
  description: string;
  bodyMarkdown: string;
}

interface Problema {
  tipo: string;
  donde: string;
  fixSugerido: string;
}

function countWords(md: string): number {
  const text = (md || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*`\-\[\]()!]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text ? text.split(" ").length : 0;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  const auth = await requireAdmin(req);
  if (auth instanceof Response) return auth;

  try {
    const body = await req.json();
    const borrador = body?.borrador;
    if (!borrador?.bodyMarkdown) {
      return jsonResponse({ error: "Falta el borrador" }, 400);
    }

    const problemas: Problema[] = (body?.problemas || []).filter(
      (p: Problema) => p && p.fixSugerido
    );
    const tiempoLecturaMin = body?.tiempoLecturaMin ? Number(body.tiempoLecturaMin) : null;
    const target = tiempoLecturaMin ? tiempoLecturaMin * 200 : null;
    const actual = countWords(borrador.bodyMarkdown);

    const userPrompt = [
      `Título: ${borrador.title || ""}`,
      `Descripción: ${borrador.description || ""}`,
      `Categorías: ${(borrador.categories || []).join(", ")}`,
      target
        ? `Target de extensión: ~${target} palabras (${tiempoLecturaMin} min de lectura). Actual: ~${actual}.`
        : "",
      ``,
      `Problemas del crítico:`,
      ...(problemas.length
        ? problemas.map(
            (p, i) => `${i + 1}. [${p.tipo}]${p.donde ? ` (${p.donde})` : ""} ${p.fixSugerido}`
          )
        : ["(sin problemas puntuales)"]),
      ``,
      `Borrador actual:\n${borrador.bodyMarkdown}`,
    ].join("\n");

    const corregido = await deepseekJson<Borrador>(SYSTEM_REVISER, userPrompt, 3000);
    if (!corregido?.bodyMarkdown) {
      return jsonResponse({ error: "El revisor no devolvió un borrador válido" }, 502);
    }

    return jsonResponse({ borrador: corregido });
  } catch (e) {
    return jsonResponse({ error: (e as Error).message }, 500);
  }
});