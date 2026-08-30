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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  const auth = await requireAdmin(req);
  if (auth instanceof Response) return auth;

  try {
    const body = await req.json();
    const url = (body?.url ?? "").toString().trim();
    if (!/^https?:\/\//i.test(url)) {
      return jsonResponse({ error: "URL inválida (debe empezar con http:// o https://)" }, 400);
    }

    let text = "";
    let title = "";
    let source = "";

    try {
      const r = await fetch(`https://r.jina.ai/${url}`, {
        headers: {
          Accept: "text/plain",
          "X-Return-Format": "markdown",
        },
      });
      if (r.ok) {
        const t = await r.text();
        if (t && t.trim().length > 200) {
          text = t;
          source = "jina";
        }
      }
    } catch {
      // fallback abajo
    }

    if (!text) {
      const r = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; MG Lab BlogAdmin/1.0)" },
      });
      if (!r.ok) throw new Error(`La URL respondió ${r.status}`);
      const html = await r.text();
      title = extractTitle(html);
      text = extractText(html);
      source = "html";
    }

    if (!text || text.trim().length < 50) {
      return jsonResponse(
        { error: "No se pudo extraer texto de la URL (puede estar bloqueada o ser muy corta)" },
        502
      );
    }

    return jsonResponse({ text: clean(text), title, source });
  } catch (e) {
    return jsonResponse({ error: (e as Error).message }, 500);
  }
});