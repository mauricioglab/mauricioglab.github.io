import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";

export default defineConfig({
  site: "https://mauricioglab.github.io/",
  base: "/",
  trailingSlash: "ignore",
  output: "static",
  server: { open: "/" },
  integrations: [tailwind()],
  markdown: {
    shikiConfig: {
      theme: 'github-light',
      wrap: true,
    },
  },
});
