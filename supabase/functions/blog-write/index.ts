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

async function deepseekJson<T>(system: string, user: string): Promise<T> {
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
      temperature: 0.7,
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

const SYSTEM_BLOGGER = `
Sos un redactor de blog técnico en español rioplatense. Escribís posts con hook al
principio (no contexto primero), párrafos cortos de 3-4 líneas, un detalle concreto o
ejemplo por sección, y voz activa. El cuerpo va en markdown (##, listas, código con
\`\`\` si corresponde).

Precisión ante todo: si no estás seguro de un dato verificable puntual (fecha de
lanzamiento, número de versión, cifra exacta), no lo afirmes con precisión falsa —
hablá en términos generales en vez de inventar un dato específico que puede estar
mal. Si incluís código, que haga realmente lo que el texto dice que hace; si es una
simplificación con fines ilustrativos, decilo explícitamente.

Devolvé ÚNICAMENTE un objeto JSON (sin texto adicional, sin bloques de código markdown
que envuelvan TODO el JSON — el markdown va sólo adentro del campo "bodyMarkdown") con
esta forma exacta:
{
  "title": string,
  "categories": string[],
  "description": string,
  "bodyMarkdown": string
}
`;

const SYSTEM_EDITOR = `
Sos el editor de un blog técnico. Evaluás un borrador contra estos criterios: el hook
engancha desde la primera línea, no hay relleno ni repetición, el ángulo prometido se
cumple, la información es precisa (sin fechas/versiones/cifras inventadas, sin código
que aparente hacer algo que no hace), y el tono es consistente. Aprobá sólo si el
borrador está realmente listo para publicar.
Devolvé ÚNICAMENTE un objeto JSON (sin texto adicional, sin bloques de código markdown) con esta forma exacta:
{
  "aprobado": boolean,
  "nota": number,
  "feedback": string
}
"nota" es de 0 a 10. Si "aprobado" es false, "feedback" debe ser accionable y concreto
(qué cambiar, no sólo "mejorar la redacción").
`;

interface Borrador {
  title: string;
  categories: string[];
  description: string;
  bodyMarkdown: string;
}

function buildUserBlogger(body: any, propuesta: any, feedback?: string): string {
  const lines: string[] = [];
  lines.push(`Tema: ${body.tema}`);
  lines.push(`Ángulo elegido: ${propuesta?.angulo ?? ""}`);
  lines.push(`Título sugerido (podés ajustarlo): ${propuesta?.tituloSugerido ?? ""}`);
  lines.push(`Resumen del ángulo: ${propuesta?.resumen ?? ""}`);
  if (body?.tono) lines.push(`Tono: ${body.tono}`);
  if (body?.tiempoLecturaMin) {
    const m = Number(body.tiempoLecturaMin);
    lines.push(
      `Tiempo de lectura objetivo: ~${m} minutos (a 200 palabras/minuto, ~${m * 200} palabras).`
    );
  }
  if (feedback) {
    lines.push("");
    lines.push("El editor rechazó la versión anterior con este feedback:");
    lines.push(feedback);
    lines.push(
      "Corregí puntualmente lo que señala el feedback. Preservá el resto del contenido tal cual salvo que el feedback indique lo contrario."
    );
  }
  return lines.join("\n");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  const auth = await requireAdmin(req);
  if (auth instanceof Response) return auth;

  try {
    const body = await req.json();
    const tema = (body?.tema ?? "").toString().trim();
    if (!tema) return jsonResponse({ error: "Falta el tema" }, 400);
    if (!body?.propuesta) {
      return jsonResponse({ error: "Falta la propuesta elegida" }, 400);
    }

    let borrador = await deepseekJson<Borrador>(
      SYSTEM_BLOGGER,
      buildUserBlogger(body, body.propuesta)
    );
    if (!borrador?.title || !borrador?.bodyMarkdown) {
      return jsonResponse({ error: "DeepSeek no devolvió un borrador válido" }, 502);
    }

    const editor = await deepseekJson<{
      aprobado: boolean;
      nota: number;
      feedback: string;
    }>(
      SYSTEM_EDITOR,
      `Título: ${borrador.title}\nDescripción: ${borrador.description}\n\n${borrador.bodyMarkdown}`
    );

    if (editor && editor.aprobado === false) {
      borrador = await deepseekJson<Borrador>(
        SYSTEM_BLOGGER,
        buildUserBlogger(body, body.propuesta, editor.feedback ?? "")
      );
    }

    return jsonResponse({ borrador });
  } catch (e) {
    return jsonResponse({ error: (e as Error).message }, 500);
  }
});