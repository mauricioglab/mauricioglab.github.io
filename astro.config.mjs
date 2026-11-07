import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import preact from "@astrojs/preact";

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
    "/pausas-activas": "/movimiento/?modo=pausas",
    "/movilidad": "/movimiento/?modo=movilidad",
    "/entrenamiento": "/movimiento/?modo=entrenamiento",
    "/admin": "/admin/gestion/",
    "/es/videos": "/videos/",
    "/en/videos": "/videos/",
  },
  server: { open: "/" },
  integrations: [tailwind(), preact()],
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
