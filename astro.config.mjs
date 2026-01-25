import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";

export default defineConfig({
  site: "https://YOUR_GITHUB_USERNAME.github.io",
  base: "/mglab-spa-depot",
  trailingSlash: "ignore",
  server: { open: "/mglab-spa-depot/" },
  integrations: [tailwind()],
});
