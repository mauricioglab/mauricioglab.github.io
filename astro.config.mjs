import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import preact from "@astrojs/preact";
import sitemap from "@astrojs/sitemap";
import domainRoutes from "./src/integrations/domain-routes.mjs";

// SITE_TARGET decide qué dominio se arma en este build:
// "personal" (default) → mauricioglab.github.io, "company" → velocitylab.com.ar
const SITE_TARGET = process.env.SITE_TARGET === "company" ? "company" : "personal";
const SITE_URL = SITE_TARGET === "company"
  ? "https://velocitylab.com.ar/"
  : "https://mauricioglab.github.io/";

export default defineConfig({
  site: SITE_URL,
  base: "/",
  trailingSlash: "ignore",
  output: "static",
  redirects: {
    // Disertaciones ahora vive en /[lang]/disertaciones/ (ambos dominios).
    "/disertaciones": "/es/disertaciones/",
    // El resto apunta a contenido exclusivo del dominio personal.
    ...(SITE_TARGET === "company" ? {} : {
      "/pausas-activas": "/movimiento/?modo=pausas",
      "/movilidad": "/movimiento/?modo=movilidad",
      "/entrenamiento": "/movimiento/?modo=entrenamiento",
      "/admin": "/admin/gestion/",
      "/es/videos": "/videos/",
      "/en/videos": "/videos/",
    }),
  },
  server: { open: "/" },
  integrations: [
    tailwind(),
    preact(),
    domainRoutes(SITE_TARGET),
    sitemap({
      // Páginas privadas, documentos sin indexar y rutas técnicas fuera del sitemap.
      filter: (page) =>
        !/\/(admin|nutricion|movimiento|vsagenda|workspace-mapper)(\/|$)/.test(page) &&
        !/\/(es|en)\/cv(\/|$)/.test(page) &&
        !/\/404(\/|$)/.test(page) &&
        // La raíz de empresa es un espejo de /es/servicios/ (su canonical).
        !(SITE_TARGET === "company" && new URL(page).pathname === "/"),
    }),
  ],
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en'],
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: false
    }
  },
  markdown: {
    shikiConfig: {
      theme: 'github-light',
      wrap: true,
    },
  },
});
