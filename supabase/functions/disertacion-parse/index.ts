import { createClient } from "npm:@supabase/supabase-js@2";
import JSZip from "npm:jszip@3.10.2";

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

function slugify(text: string): string {
  return (
    (text || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "disertacion"
  );
}

function detectMime(name: string, fallback = "image/png"): string {
  const ext = (name.split(".").pop() || "").toLowerCase();
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    case "bmp":
      return "image/bmp";
    default:
      return fallback;
  }
}

interface SlideText {
  index: number;
  text: string;
}

interface ParseResult {
  slides: SlideText[];
  media: { name: string; data: Uint8Array; mime: string }[];
}

/**
 * Extrae texto por diapositiva y las imágenes embebidas de un .pptx (un zip).
 * No soporta .ppt binario (OLE).
 */
async function parsePptx(bytes: Uint8Array): Promise<ParseResult> {
  const zip = await JSZip.loadAsync(bytes);
  const entries = Object.keys(zip.files);
  const slideEntries = entries
    .filter((n) => /^ppt\/slides\/slide\d+\.xml$/i.test(n))
    .sort((a, b) => {
      const na = Number(a.match(/slide(\d+)/)?.[1]);
      const nb = Number(b.match(/slide(\d+)/)?.[1]);
      return na - nb;
    });

  const slides: SlideText[] = [];
  for (const name of slideEntries) {
    const xml = await zip.files[name].async("string");
    const runs = [...xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)]
      .map((m) => m[1])
      .filter((t) => t.trim().length > 0);
    slides.push({
      index: slideEntries.indexOf(name) + 1,
      text: runs.join("\n"),
    });
  }

  const media: ParseResult["media"] = [];
  for (const name of entries) {
    if (!/^ppt\/media\/[^/]+$/i.test(name)) continue;
    const isImage = /\.(png|jpe?g|gif|webp|bmp)$/i.test(name);
    if (!isImage) continue;
    const data = await zip.files[name].async("uint8array");
    media.push({ name: name.split("/").pop()!, data, mime: detectMime(name) });
  }

  return { slides, media };
}

const SYSTEM_BULLETS = `
Sos un asistente que ayuda a un profesional a documentar sus charlas. A partir del
texto de una presentación o de las notas del autor, resumís DE QUÉ TRATÓ la charla en
bullets breves y concretos, en español.

Reglas:
- 4 a 8 bullets. Cada uno de una sola idea, de 8 a 20 palabras.
- Escribí en pasado y en primera persona ("Presenté…", "Expliqué…", "Comparé…").
- No describas la organización del evento; enfocate en lo que el autor hizo o dijo.
- No inventes contenido que no esté en el material.
- Si el texto es un borrador desordenado, ordenalo y quedate con lo esencial.
- Si una parte no aporta, ignorala.
- Detectá el tema y proponé un título corto de la charla si no se indica.

Devolvé ÚNICAMENTE un objeto JSON con esta forma exacta:
{
  "title": string,
  "bullets": string[]
}
`;

const SYSTEM_TITLE = `
Sos un asistente que ayuda a un profesional a documentar sus charlas. A partir del
texto de una presentación o de las notas del autor, proponé un título corto y
atractivo para la charla (máx 10 palabras), en español, sin comillas.

Devolvé ÚNICAMENTE un objeto JSON con esta forma exacta:
{ "title": string }
`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  const auth = await requireAdmin(req);
  if (auth instanceof Response) return auth;

  try {
    const body = await req.json();
    const fileBase64 = (body?.file ?? "").toString();
    const fileName = (body?.fileName ?? "presentacion.pptx").toString();
    const titleHint = (body?.title ?? "").toString().trim();
    const eventName = (body?.eventName ?? "").toString().trim();
    const textSource = (body?.text ?? "").toString().trim();

    let slides: SlideText[] = [];
    let media: ParseResult["media"] = [];
    let allText = "";

    if (fileBase64) {
      if (!/\.pptx$/i.test(fileName)) {
        return jsonResponse(
          { error: "Solo se soporta formato .pptx (zip). Convertí el .ppt a .pptx y reintentá." },
          400
        );
      }

      // Decodificar base64 → bytes
      const bin = atob(fileBase64.replace(/\s/g, ""));
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);

      ({ slides, media } = await parsePptx(bytes));
      if (slides.length === 0) {
        return jsonResponse({ error: "No se pudo extraer texto de las diapositivas." }, 422);
      }

      allText = slides
        .map((s) => `[Slide ${s.index}]\n${s.text}`)
        .join("\n\n")
        .slice(0, 12000);
    } else if (textSource) {
      // Modo texto: sin archivo, la IA mejora/estructura el texto crudo del autor.
      allText = textSource.slice(0, 12000);
    } else {
      return jsonResponse({ error: "Falta el archivo o el texto de la charla" }, 400);
    }

    // Título: si no viene, lo propone la IA
    let title = titleHint;
    if (!title) {
      try {
        const t = await deepseekJson<{ title: string }>(SYSTEM_TITLE, allText, 400);
        title = t?.title?.trim() || "";
      } catch {
        title = "";
      }
    }

    // Bullets
    const userPrompt = [
      `Evento: ${eventName || "no indicado"}`,
      title ? `Título sugerido/propuesto: ${title}` : null,
      `Material de la charla:\n${allText}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    const parsed = await deepseekJson<{ bullets: string[] }>(
      SYSTEM_BULLETS,
      userPrompt,
      1500
    );
    const bullets = Array.isArray(parsed?.bullets) ? parsed.bullets : [];
    if (bullets.length === 0) {
      return jsonResponse({ error: "No se pudieron generar bullets de la charla." }, 502);
    }

    // Subir imágenes al bucket (service-role)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const basePath = slugify(title || fileName);
    const uploaded: string[] = [];
    for (const m of media) {
      const ext = (m.name.split(".").pop() || "png").toLowerCase();
      const path = `slides/${basePath}-${Date.now()}-${m.name}`;
      const { error: upErr } = await admin.storage
        .from("disertaciones-files")
        .upload(path, m.data, { contentType: m.mime, upsert: true });
      if (upErr) {
        console.warn(`No se pudo subir ${m.name}: ${upErr.message}`);
        continue;
      }
      uploaded.push(`${supabaseUrl}/storage/v1/object/public/disertaciones-files/${path}`);
    }

    // La portada se elige manualmente en el admin (slide 1 recomendada),
    // acá devolvemos la lista de URLs; el front decide.
    return jsonResponse({
      title: title || null,
      bullets,
      slideCount: slides.length,
      slideUrls: uploaded,
      firstSlideUrl: uploaded[0] || null,
      secondSlideUrl: uploaded[1] || null,
    });
  } catch (e) {
    return jsonResponse({ error: (e as Error).message }, 500);
  }
});
