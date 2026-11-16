import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import preact from "@astrojs/preact";
import sitemap from "@astrojs/sitemap";
import domainRoutes from "./src/integrations/domain-routes.mjs";

// SITE_TARGET decide qué dominio se arma en este build:
// "personal" (default) → mauricio.expertotech.com.ar, "company" → velocitylab.com.ar
const SITE_TARGET = process.env.SITE_TARGET === "company" ? "company" : "personal";
const SITE_URL = SITE_TARGET === "company"
  ? "https://velocitylab.com.ar/"
  : "https://mauricio.expertotech.com.ar/";

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
      "/sobre-mi": { status: 301, destination: "/es/sobre-mi/" },
      "/blog/about": { status: 301, destination: "/es/sobre-mi/" },
      "/contacto": { status: 301, destination: "/es/contacto/" },
      "/es/disertaciones": { status: 301, destination: "/es/eventos/" },
      "/disertaciones": { status: 301, destination: "/es/eventos/" },
      "/pausas-activas": "/movimiento/?modo=pausas",
      "/movilidad": "/movimiento/?modo=movilidad",
      "/entrenamiento": "/movimiento/?modo=entrenamiento",
      "/es/proyectos/validacion-biometrica": { status: 301, destination: "/es/portfolio/?caso=validacion-biometrica" },
      "/es/proyectos/billetera-virtual": { status: 301, destination: "/es/portfolio/?caso=billetera-virtual" },
      "/es/proyectos/monitoreo-agricola": { status: 301, destination: "/es/portfolio/?caso=monitoreo-agricola" },
      "/es/proyectos/auditorias-datos": { status: 301, destination: "/es/portfolio/?caso=auditorias-datos" },
      "/es/proyectos/coca-cola-embonor": { status: 301, destination: "/es/portfolio/?caso=coca-cola-embonor" },
      "/es/proyectos/mundial-2026": { status: 301, destination: "/es/portfolio/?caso=mundial-2026" },
      "/es/proyectos/abandono-estudiantil": { status: 301, destination: "/es/portfolio/?caso=abandono-estudiantil" },
      "/en/proyectos/validacion-biometrica": { status: 301, destination: "/en/portfolio/?caso=validacion-biometrica" },
      "/en/proyectos/billetera-virtual": { status: 301, destination: "/en/portfolio/?caso=billetera-virtual" },
      "/en/proyectos/monitoreo-agricola": { status: 301, destination: "/en/portfolio/?caso=monitoreo-agricola" },
      "/en/proyectos/auditorias-datos": { status: 301, destination: "/en/portfolio/?caso=auditorias-datos" },
      "/en/proyectos/coca-cola-embonor": { status: 301, destination: "/en/portfolio/?caso=coca-cola-embonor" },
      "/en/proyectos/mundial-2026": { status: 301, destination: "/en/portfolio/?caso=mundial-2026" },
      "/en/proyectos/abandono-estudiantil": { status: 301, destination: "/en/portfolio/?caso=abandono-estudiantil" },
      "/caso-arquitectura": { status: 301, destination: "/es/portfolio/?caso=caso-arquitectura" },
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
