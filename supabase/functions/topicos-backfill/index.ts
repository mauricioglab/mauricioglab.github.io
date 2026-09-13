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

const TEMAS = [
  "IA",
  "Tecnología",
  "Ciencia",
  "Productividad",
  "Filosofía",
  "Libros",
  "Estudio",
  "Salud",
  "Sociedad",
  "Creatividad",
];

async function deepseekJson<T>(system: string, user: string, maxTokens = 1024): Promise<T> {
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
      temperature: 0.2,
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

const SYSTEM_CLASSIFIER = `
Clasificás contenido en temas para un sitio. A partir de Título, Descripción y parte
del cuerpo, elegís 1 a 3 temas de esta lista EXACTA, sin inventar ni renombrar:
IA, Tecnología, Ciencia, Productividad, Filosofía, Libros, Estudio, Salud, Sociedad, Creatividad

Elegí los temas que mejor describan de qué trata el contenido (no el formato ni la
audiencia). Devolvé ÚNICAMENTE un objeto JSON:
{
  "topicos": string[]
}
`;

function cleanBody(body: string): string {
  const t = (body || "").replace(/\r\n/g, "\n").trim();
  return t.length > 3500 ? t.slice(0, 3500) + "\n... (recortado)" : t;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  const auth = await requireAdmin(req);
  if (auth instanceof Response) return auth;

  try {
    const body = await req.json();
    const limit = Math.min(Number(body?.limit) || 20, 50);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) {
      return jsonResponse({ error: "Falta configuración de Supabase" }, 500);
    }
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: blogs, error: blogsError } = await admin
      .from("blogs")
      .select("id, title, description, body_markdown")
      .eq("topicos", "{}")
      .limit(limit);
    if (blogsError) return jsonResponse({ error: `Error leyendo blogs: ${blogsError.message}` }, 500);

    const { data: recursos, error: recursosError } = await admin
      .from("recursos")
      .select("id, title, description, body_markdown")
      .eq("topicos", "{}")
      .limit(limit);
    if (recursosError) return jsonResponse({ error: `Error leyendo recursos: ${recursosError.message}` }, 500);

    const results: { tipo: string; id: string; titulo: string; topicos: string[] }[] = [];
    const errors: { tipo: string; id: string; error: string }[] = [];

    for (const row of blogs) {
      try {
        const userPrompt = [
          `Título: ${row.title}`,
          `Descripción: ${row.description || "(vacía)"}`,
          `Cuerpo:\n${cleanBody(row.body_markdown || "")}`,
        ].join("\n\n");
        const parsed = await deepseekJson<{ topicos: string[] }>(SYSTEM_CLASSIFIER, userPrompt);
        const topicos = Array.isArray(parsed?.topicos)
          ? [...new Set(parsed.topicos.filter((t) => TEMAS.includes(t)))].slice(0, 3)
          : [];
        await admin.from("blogs").update({ topicos }).eq("id", row.id);
        results.push({ tipo: "blog", id: row.id, titulo: row.title, topicos });
      } catch (e) {
        errors.push({ tipo: "blog", id: row.id, error: (e as Error).message });
      }
    }

    for (const row of recursos) {
      try {
        const userPrompt = [
          `Título: ${row.title}`,
          `Descripción: ${row.description || "(vacía)"}`,
          `Cuerpo:\n${cleanBody(row.body_markdown || "")}`,
        ].join("\n\n");
        const parsed = await deepseekJson<{ topicos: string[] }>(SYSTEM_CLASSIFIER, userPrompt);
        const topicos = Array.isArray(parsed?.topicos)
          ? [...new Set(parsed.topicos.filter((t) => TEMAS.includes(t)))].slice(0, 3)
          : [];
        await admin.from("recursos").update({ topicos }).eq("id", row.id);
        results.push({ tipo: "recurso", id: row.id, titulo: row.title, topicos });
      } catch (e) {
        errors.push({ tipo: "recurso", id: row.id, error: (e as Error).message });
      }
    }

    return jsonResponse({
      procesados: results.length,
      errores: errors.length,
      pendientesBlogs: (blogs?.length ?? 0) - results.filter((r) => r.tipo === "blog").length,
      pendientesRecursos: (recursos?.length ?? 0) - results.filter((r) => r.tipo === "recurso").length,
      results,
      errors,
    });
  } catch (e) {
    return jsonResponse({ error: (e as Error).message }, 500);
  }
});