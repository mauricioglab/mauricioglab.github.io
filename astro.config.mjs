import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";

export default defineConfig({
  site: "https://mauricioglab.github.io/",
  base: "/",
  trailingSlash: "ignore",
  output: "static",
  redirects: {
    "/pausas-activas": "/movimiento/?modo=pausas",
    "/movilidad": "/movimiento/?modo=movilidad",
    "/entrenamiento": "/movimiento/?modo=entrenamiento",
  },
  server: { open: "/" },
  integrations: [tailwind()],
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
