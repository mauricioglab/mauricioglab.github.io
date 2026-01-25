// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
// Para GitHub Pages: reemplaza YOUR_GITHUB_USERNAME por tu usuario de GitHub.
// Si el repo tiene otro nombre, cambia también base.
export default defineConfig({
  site: 'https://YOUR_GITHUB_USERNAME.github.io',
  base: '/mglab-spa-depot',
});
