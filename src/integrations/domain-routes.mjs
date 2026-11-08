import { readdirSync, statSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, relative, extname, basename, dirname } from "node:path";

const ROUTE_EXTENSIONS = new Set([".astro", ".ts", ".js"]);

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full, out);
    } else if (ROUTE_EXTENSIONS.has(extname(entry))) {
      out.push(full);
    }
  }
  return out;
}

// Deriva el pattern de ruta de Astro a partir de un path de archivo,
// igual que Astro lo haría si el archivo viviera en src/pages/.
function patternFromFile(root, file) {
  const rel = relative(root, file).split(/\\|\//).join("/");
  const ext = extname(rel);
  let withoutExt = rel.slice(0, -ext.length);
  if (basename(withoutExt) === "index") {
    withoutExt = dirname(withoutExt);
    if (withoutExt === ".") withoutExt = "";
  }
  return "/" + withoutExt;
}

/**
 * Integración local: arma las rutas del build según SITE_TARGET, leyendo
 * físicamente solo las carpetas que le corresponden a ese dominio
 * (src/pages-shared/ siempre, más src/pages-personal/ o src/pages-company/).
 * src/pages/ queda solo para lo universal (404.astro).
 */
export default function domainRoutes(target) {
  const dirs = target === "company"
    ? ["src/pages-shared", "src/pages-company"]
    : ["src/pages-shared", "src/pages-personal"];

  return {
    name: "domain-routes",
    hooks: {
      // El dominio de la empresa no sirve herramientas ni descargas del personal:
      // public/ se copia entero, así que se borra lo que no le corresponde.
      "astro:build:done": ({ dir }) => {
        if (target !== "company") return;
        const out = fileURLToPath(dir);
        for (const d of ["vsagenda", "prompt", "calculadora", "extensions", "entrenamiento", "downloads", "lib", "scripts", "blog"]) {
          rmSync(join(out, d), { recursive: true, force: true });
        }
      },
      "astro:config:setup": ({ injectRoute, config }) => {
        for (const dir of dirs) {
          const absDir = new URL(dir + "/", config.root).pathname.replace(/^\/([A-Za-z]:)/, "$1");
          let files;
          try {
            files = walk(absDir);
          } catch {
            continue;
          }
          for (const file of files) {
            const pattern = patternFromFile(absDir, file);
            injectRoute({
              pattern: pattern === "" ? "/" : pattern,
              entrypoint: "./" + relative(process.cwd(), file).split("\\").join("/"),
            });
          }
        }
      },
    },
  };
}
