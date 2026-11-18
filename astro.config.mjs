import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import preact from "@astrojs/preact";
import sitemap from "@astrojs/sitemap";
import domainRoutes from "./src/integrations/domain-routes.mjs";

const SITE_URL = "https://mauricio.expertotech.com.ar/";

export default defineConfig({
  site: SITE_URL,
  base: "/",
  trailingSlash: "ignore",
  output: "static",
  redirects: {
    "/sobre-mi": { status: 301, destination: "/es/sobre-mi/" },
    "/blog/about": { status: 301, destination: "/es/sobre-mi/" },
    "/contacto": { status: 301, destination: "/es/contacto/" },
    "/es/disertaciones": { status: 301, destination: "/es/eventos/" },
    "/disertaciones": { status: 301, destination: "/es/eventos/" },
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
  },
  server: { open: "/" },
  integrations: [
    tailwind(),
    preact(),
    domainRoutes(),
    sitemap({
      // Páginas privadas, documentos sin indexar y rutas técnicas fuera del sitemap.
      filter: (page) =>
        !/\/(admin|lab)(\/|$)/.test(page) &&
        !/\/(es|en)\/cv(\/|$)/.test(page) &&
        !/\/404(\/|$)/.test(page),
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
