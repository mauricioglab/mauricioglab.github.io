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

async function generateImageViaOpenRouter(
  prompt: string
): Promise<{ base64: string; mimeType: string }> {
  const apiKey = Deno.env.get("OPENROUTER_API_KEY");
  if (!apiKey) throw new Error("Falta OPENROUTER_API_KEY");
  const model =
    Deno.env.get("OPENROUTER_IMAGE_MODEL") ?? "google/gemini-3.1-flash-lite-image";

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://mauricioglab.github.io",
      "X-Title": "MG Lab Blog Admin",
    },
    body: JSON.stringify({
      model,
      modalities: ["image", "text"],
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const raw = await res.text();
  if (!res.ok) throw new Error(`OpenRouter (${res.status}): ${raw.slice(0, 500)}`);

  let data: any;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(`Respuesta inválida de OpenRouter: ${raw.slice(0, 500)}`);
  }

  const images = data?.choices?.[0]?.message?.images;
  if (!Array.isArray(images) || images.length === 0) {
    const text = data?.choices?.[0]?.message?.content;
    throw new Error(
      `OpenRouter no devolvió imagen.${
        text ? ` Texto: ${String(text).slice(0, 200)}` : ""
      }`
    );
  }

  const url = images[0]?.image_url?.url;
  if (!url) throw new Error("OpenRouter devolvió imagen sin URL.");

  const m = /^data:([^;]+);base64,(.*)$/s.exec(url);
  if (m) {
    return { mimeType: m[1], base64: m[2] };
  }

  const imgRes = await fetch(url);
  if (!imgRes.ok) throw new Error(`No se pudo descargar la imagen (${imgRes.status})`);
  const buf = new Uint8Array(await imgRes.arrayBuffer());
  let bin = "";
  for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
  const mimeType = imgRes.headers.get("content-type") ?? "image/png";
  return { mimeType, base64: btoa(bin) };
}

function slugify(text: string): string {
  return (
    (text || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "post"
  );
}

const SYSTEM_ART = `
Sos un director de arte. A partir del contenido de un post de blog, redactás un prompt
de imagen en inglés para la TAPA del post (orientación 16:9, landscape).
Estilo: ilustración digital moderna, limpia, profesional, sin texto en la imagen.
Devolvé ÚNICAMENTE un objeto JSON con esta forma exacta:
{ "prompt": string }
`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  const auth = await requireAdmin(req);
  if (auth instanceof Response) return auth;

  try {
    const body = await req.json();
    const title = (body?.title ?? "").toString().trim();
    const description = (body?.description ?? "").toString().trim();
    const markdown = (body?.bodyMarkdown ?? "").toString().trim();
    const customPrompt = (body?.prompt ?? "").toString().trim();
    if (!title) return jsonResponse({ error: "Falta el título" }, 400);

    let prompt = customPrompt;
    if (!prompt) {
      const content = [
        `Título: ${title}`,
        description ? `Descripción: ${description}` : null,
        markdown ? `Contenido:\n${markdown.slice(0, 4000)}` : null,
      ]
        .filter(Boolean)
        .join("\n\n");
      const art = await deepseekJson<{ prompt: string }>(SYSTEM_ART, content);
      prompt = art?.prompt?.trim() || "";
      if (!prompt) return jsonResponse({ error: "DeepSeek no generó un prompt" }, 502);
    }

    const { base64, mimeType } = await generateImageViaOpenRouter(prompt);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const ext =
      mimeType === "image/jpeg" ? "jpg" : mimeType === "image/webp" ? "webp" : "png";
    const path = `covers/${slugify(title)}-${Date.now()}.${ext}`;

    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const { error: uploadError } = await admin.storage
      .from("blog-images")
      .upload(path, bytes, { contentType: mimeType, upsert: true });
    if (uploadError) {
      throw new Error(`No se pudo subir la imagen: ${uploadError.message}`);
    }

    const coverUrl = `${supabaseUrl}/storage/v1/object/public/blog-images/${path}`;
    return jsonResponse({ coverUrl, prompt });
  } catch (e) {
    return jsonResponse({ error: (e as Error).message }, 500);
  }
});