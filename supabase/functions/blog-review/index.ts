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
      temperature: 0.3,
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

const SYSTEM_CRITIC = `
Sos el crítico de un blog técnico. Evaluás un borrador y devolvés problemas accionables.

Criterios:
- hook: la primera línea engancha y va al grano, sin contexto previo innecesario
- precision: no hay fechas, versiones ni cifras inventadas; el código hace lo que dice
- tono: consistente, español rioplatense, párrafos cortos
- estructura: secciones claras con ##, sin relleno ni repeticiones
- relleno: nada de frases genéricas ni muletillas

Devolvé ÚNICAMENTE un objeto JSON (sin texto adicional, sin bloques de código markdown) con esta forma exacta:
{
  "aprobado": boolean,
  "nota": number,
  "problemas": [{"tipo": "hook|precision|tono|relleno|estructura", "donde": string, "fixSugerido": string}],
  "resumen": string
}
"nota" es de 0 a 10. "aprobado" debe ser true SOLO si el borrador está listo para publicar.
"problemas" puede ser un array vacío si no hay nada que corregir. Cada "fixSugerido" debe ser concreto y accionable (qué cambiar, no "mejorar la redacción").
`;

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

function lengthProblem(bodyMarkdown: string, tiempoLecturaMin: number | null): Problema | null {
  if (!tiempoLecturaMin || tiempoLecturaMin < 1) return null;
  const target = tiempoLecturaMin * 200;
  const actual = countWords(bodyMarkdown);
  const diff = Math.abs(actual - target) / target;
  if (diff <= 0.15) return null;
  const falta = target - actual;
  return {
    tipo: "extension",
    donde: "cuerpo",
    fixSugerido: `El post tiene ~${actual} palabras y el target es ~${target} (${tiempoLecturaMin} min de lectura). ${
      falta > 0
        ? `Expandí ~${Math.abs(falta)} palabras`
        : `Recortá ~${Math.abs(falta)} palabras`
    } para acercarte al target.`,
  };
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

    const tiempoLecturaMin = body?.tiempoLecturaMin ? Number(body.tiempoLecturaMin) : null;
    const wordCount = countWords(borrador.bodyMarkdown);

    const userPrompt = [
      `Título: ${borrador.title || ""}`,
      `Descripción: ${borrador.description || ""}`,
      `Categorías: ${(borrador.categories || []).join(", ")}`,
      `Extensión actual: ~${wordCount} palabras${tiempoLecturaMin ? ` (target ~${tiempoLecturaMin * 200} palabras)` : ""}`,
      ``,
      `Borrador:\n${(borrador.bodyMarkdown || "").slice(0, 8000)}`,
    ].join("\n");

    const critic = await deepseekJson<{
      aprobado: boolean;
      nota: number;
      problemas: Problema[];
      resumen: string;
    }>(SYSTEM_CRITIC, userPrompt, 800);

    const problemas: Problema[] = [];
    const lp = lengthProblem(borrador.bodyMarkdown, tiempoLecturaMin);
    if (lp) problemas.push(lp);
    if (Array.isArray(critic?.problemas)) problemas.push(...critic.problemas);

    const review = {
      aprobado: !!critic?.aprobado && problemas.length === 0,
      nota: critic?.nota ?? null,
      problemas,
      resumen: critic?.resumen ?? "",
    };

    return jsonResponse({ review });
  } catch (e) {
    return jsonResponse({ error: (e as Error).message }, 500);
  }
});