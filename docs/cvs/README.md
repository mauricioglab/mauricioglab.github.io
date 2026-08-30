# CV único

Esta carpeta documenta la unificación de marca a un solo CV (histórico: antes había
5 versiones separadas por perfil — developer, líder técnico, docente/speaker,
híbrido, freelance — consolidadas en una sola identidad).

**La fuente de verdad del CV es la página viva `src/pages/[lang]/cv.astro`** (rutas
`/es/cv/` y `/en/cv/`, localizadas; el contenido vive en `src/i18n/es/cv.json` y
`src/i18n/en/cv.json`). `/es/cv/` es el destino real del botón "Descargar CV" del
sitio — no hay PDF estático todavía.
Este README queda solo como referencia de las reglas de contenido que rigen esa
página y el resto del sitio:

- `/blog/about/` - Página "Acerca de" del blog
- `/[lang]/portfolio/` - Portfolio unificado
- `/[lang]/servicios/` - Landing de servicios
- `src/i18n/` - Traducciones de experiencia y skills

## Reglas de contenido

- **Un solo posicionamiento**: Software Engineer especializado en IA y Automatización. Analista de Sistemas, Datos y Docencia son fortalezas complementarias, no identidades separadas.
- **Regla de foco**: no representar todas las actividades con el mismo peso. El eje es Software Engineering + IA/Automatización.
- **Sin claims no verificables**: cualquier logro, métrica o proyecto debe ser defendible en una entrevista técnica. No incluir años/proyectos/equipos inflados.
- **Años de experiencia**: no hardcodear un número — se calcula desde el inicio real (07/2021) en función de la fecha de build.

## Contacto (datos reales)

- **Email:** mauriciogcode@gmail.com
- **LinkedIn:** linkedin.com/in/mauricioglab
- **GitHub:** github.com/mauricioglab
- **Calendly:** calendly.com/mauricioglab
- **Ubicación:** Córdoba, Argentina
