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
      temperature: 0.6,
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

function decodeEntities(s: string): string {
  const map: Record<string, string> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&nbsp;": " ",
    "&hellip;": "…",
  };
  return s.replace(/&(?:[a-zA-Z]+|#\d+|#x[0-9a-fA-F]+);/g, (m) => {
    if (map[m]) return map[m];
    if (/^&#\d+;/.test(m)) {
      const code = parseInt(m.slice(2, -1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : m;
    }
    if (/^&#x[0-9a-fA-F]+;/.test(m)) {
      const code = parseInt(m.slice(3, -1), 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : m;
    }
    return m;
  });
}

function extractTitle(html: string): string {
  const m = /<title[^>]*>([^<]+)<\/title>/i.exec(html);
  return m ? decodeEntities(m[1].trim()) : "";
}

function extractText(html: string): string {
  let h = html;
  h = h.replace(/<script[\s\S]*?<\/script>/gi, " ");
  h = h.replace(/<style[\s\S]*?<\/style>/gi, " ");
  h = h.replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");
  h = h.replace(/<br\s*\/?>/gi, "\n");
  h = h.replace(/<\/p>/gi, "\n\n");
  h = h.replace(/<\/h[1-6]>/gi, "\n\n");
  h = h.replace(/<\/li>/gi, "\n");
  h = h.replace(/<\/div>/gi, "\n");
  h = h.replace(/<[^>]+>/g, " ");
  h = decodeEntities(h);
  h = h.replace(/[ \t]+/g, " ");
  h = h.replace(/\n[ \t]+/g, "\n");
  h = h.replace(/[ \t]+\n/g, "\n");
  h = h.replace(/\n{3,}/g, "\n\n");
  return h.trim();
}

function clean(text: string): string {
  let t = (text || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  t = t.replace(/\n{3,}/g, "\n\n").trim();
  if (t.length > 12000) {
    t = t.slice(0, 12000) + "\n... (recortado)";
  }
  return t;
}

function extractYoutubeId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?.*v=|shorts\/|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  return m ? m[1] : null;
}

async function fetchJina(url: string): Promise<string> {
  const r = await fetch(`https://r.jina.ai/${url}`, {
    headers: {
      Accept: "text/plain",
      "X-Return-Format": "markdown",
      "X-Timeout": "30",
    },
  });
  if (!r.ok) throw new Error(`Jina respondió ${r.status}`);
  const t = await r.text();
  if (!t || t.trim().length < 50) throw new Error("Jina devolvió texto vacío");
  return t;
}

async function fetchOembedTitle(url: string): Promise<string> {
  try {
    const r = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
    if (r.ok) {
      const j = await r.json();
      return String(j?.title ?? "").trim();
    }
  } catch {
    // ignorar
  }
  return "";
}

async function fetchHtmlText(url: string): Promise<{ title: string; text: string }> {
  const r = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; MG Lab ZonaLab/1.0)" },
  });
  if (!r.ok) throw new Error(`La URL respondió ${r.status}`);
  const html = await r.text();
  return { title: extractTitle(html), text: extractText(html) };
}

const RECURSOS_CATEGORIES = [
  "Video",
  "Artículo",
  "Reporte",
  "Tutorial",
  "Curso",
  "Libro",
  "Podcast",
];

const SYSTEM_ZONALAB = `
Sos un docente que prepara un recurso de estudio para sus alumnos. A partir de una
FRASE del profesor (semilla) y del MATERIAL de una fuente (video o reporte), escribís
un mini-artículo en español para estudiantes.

Reglas:
- La frase del profesor es la guía: desarrollala y mejorala, no la copies textual.
- Usá el material traído como fuente de datos; no inventes cifras ni hechos que no
  estén en el material. Si no está, hablá en términos generales.
- Estructura en markdown: un intro corto (hook), secciones con ##, listas y un cierre
  con "Para llevar" (3-4 takeaways).
- Extensión: 300-600 palabras. Párrafos cortos. Voz activa. Sin relleno.
- El título debe ser claro y atractivo para un alumno (máx 10 palabras).
- Categorías: elegí SIEMPRE de esta lista EXACTA (1 a 2), sin inventar ni renombrar:
  Video, Artículo, Reporte, Tutorial, Curso, Libro, Podcast

Devolvé ÚNICAMENTE un objeto JSON (sin texto adicional) con esta forma exacta:
{
  "title": string,
  "categories": string[],
  "description": string,
  "bodyMarkdown": string
}
`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  const auth = await requireAdmin(req);
  if (auth instanceof Response) return auth;

  try {
    const body = await req.json();
    const url = (body?.url ?? "").toString().trim();
    const frase = (body?.frase ?? "").toString().trim();

    if (!/^https?:\/\//i.test(url)) {
      return jsonResponse({ error: "URL inválida (debe empezar con http:// o https://)" }, 400);
    }
    if (!frase) {
      return jsonResponse({ error: "Escribí una frase/idea semilla." }, 400);
    }

    const videoId = extractYoutubeId(url);
    const sourceType = videoId ? "youtube" : "web";
    let coverUrl = videoId
      ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
      : "";

    // Traer el texto de la fuente
    let sourceText = "";
    let sourceTitle = "";

    try {
      sourceText = await fetchJina(url);
    } catch {
      sourceText = "";
    }

    if (!sourceText) {
      const { title, text } = await fetchHtmlText(url);
      sourceTitle = title;
      sourceText = text;
    }

    if (videoId && !sourceTitle) {
      sourceTitle = await fetchOembedTitle(url);
    }

    if (!sourceText || sourceText.trim().length < 50) {
      // Sin material: se arma solo con la frase y el titulo (si hay).
      sourceText = "";
    }

    const userPrompt = [
      `FRASE del profesor:\n${frase}`,
      sourceText
        ? `MATERIAL de la fuente (${sourceType}):\n${sourceText.slice(0, 12000)}`
        : "MATERIAL de la fuente: no disponible (se generará solo con la frase).",
      sourceTitle ? `Título de la fuente: ${sourceTitle}` : null,
      `URL: ${url}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    const parsed = await deepseekJson<{
      title: string;
      categories: string[];
      description: string;
      bodyMarkdown: string;
    }>(SYSTEM_ZONALAB, userPrompt, 3000);

    if (!parsed?.title || !parsed?.bodyMarkdown) {
      return jsonResponse({ error: "La IA no devolvió un recurso válido" }, 502);
    }

    const categories = Array.isArray(parsed.categories)
      ? parsed.categories.filter((c) => RECURSOS_CATEGORIES.includes(c)).slice(0, 2)
      : [];

    return jsonResponse({
      title: parsed.title,
      categories,
      description: parsed.description ?? "",
      bodyMarkdown: parsed.bodyMarkdown,
      sourceUrl: url,
      sourceType,
      sourceTitle,
      videoId,
      coverUrl,
      hadSource: Boolean(sourceText),
    });
  } catch (e) {
    return jsonResponse({ error: (e as Error).message }, 500);
  }
});