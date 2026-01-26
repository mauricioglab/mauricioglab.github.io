import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";

export default defineConfig({
  site: "https://mauricioglab.github.io/mglab-spa-depot/",
  base: "/mglab-spa-depot",
  trailingSlash: "ignore",
  output: "static",
  server: { open: "/mglab-spa-depot/" },
  integrations: [tailwind()],
});
