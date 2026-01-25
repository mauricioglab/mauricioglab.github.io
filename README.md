# Astro Starter Kit: Minimal

```sh
npm create astro@latest -- --template minimal
```

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
├── src/
│   └── pages/
│       └── index.astro
└── package.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 📦 Deploy en GitHub Pages

El proyecto incluye un workflow de GitHub Actions para desplegar en GitHub Pages.

1. **Configura `astro.config.mjs`**: sustituye `YOUR_GITHUB_USERNAME` por tu usuario de GitHub. Si el repositorio tiene otro nombre, cambia también `base`.

2. **Habilita GitHub Pages**: en tu repo → **Settings** → **Pages** → **Source** = **GitHub Actions**.

3. **Sube el código** y haz push a `main` o `master`. El workflow se ejecutará y publicará en  
   `https://<tu-usuario>.github.io/mglab-spa-depot`.

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
