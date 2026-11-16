// Recursos editables del CMS de Mauricio (el blog, las disertaciones y los recursos usan sus paneles propios) (tablas de Supabase). Para sumar uno: agregar una entrada acá.
import type { Resource } from '../components/admin/AbmPanel';

const PAGES = ['home', 'sobre-mi', 'portafolio', 'contacto'];
const LANGS = ['es', 'en'];

export const RESOURCES: Resource[] = [
  {
    table: 'site_content', label: 'Textos', orderBy: { column: 'page' },
    listColumns: ['page', 'key', 'lang', 'value'], defaults: { lang: 'es' },
    fields: [
      { name: 'page', label: 'Página', type: 'select', options: PAGES, required: true },
      { name: 'key', label: 'Clave', type: 'text', required: true, help: 'Ej.: banner_title, banner_button, quote, about_title.' },
      { name: 'lang', label: 'Idioma', type: 'select', options: LANGS, required: true },
      { name: 'value', label: 'Texto', type: 'textarea', required: true },
    ],
  },
  {
    table: 'projects', label: 'Proyectos', orderBy: { column: 'position' },
    listColumns: ['title', 'category', 'lang', 'published'], defaults: { lang: 'es', published: true },
    fields: [
      { name: 'slug', label: 'Identificador', type: 'text', required: true },
      { name: 'lang', label: 'Idioma', type: 'select', options: LANGS, required: true },
      { name: 'title', label: 'Título', type: 'text', required: true },
      { name: 'summary', label: 'Resumen', type: 'textarea' },
      { name: 'category', label: 'Categoría', type: 'text' },
      { name: 'tags', label: 'Etiquetas', type: 'tags' },
      { name: 'links', label: 'Enlaces (JSON)', type: 'json', help: 'Ej.: {"demo": "https://…"}' },
      { name: 'featured', label: 'Destacado', type: 'checkbox' },
      { name: 'position', label: 'Orden', type: 'number' },
      { name: 'published', label: 'Publicado', type: 'checkbox' },
    ],
  },
  {
    table: 'gallery_items', label: 'Galería', orderBy: { column: 'position' },
    listColumns: ['slot', 'caption', 'published'], defaults: { published: true },
    fields: [
      { name: 'slot', label: 'Espacio', type: 'text', required: true, help: 'Ej.: mosaico-1, trayectoria-1 … trayectoria-10.' },
      { name: 'image_url', label: 'Imagen', type: 'image', bucket: 'blog-images' },
      { name: 'alt', label: 'Texto alternativo', type: 'text' },
      { name: 'caption', label: 'Epígrafe (tema · institución · fecha)', type: 'text' },
      { name: 'position', label: 'Orden', type: 'number' },
      { name: 'published', label: 'Publicado', type: 'checkbox' },
    ],
  },
  {
    table: 'skills', label: 'Habilidades', orderBy: { column: 'position' },
    listColumns: ['group_name', 'name', 'published'], defaults: { published: true },
    fields: [
      { name: 'group_name', label: 'Grupo', type: 'text', required: true },
      { name: 'name', label: 'Nombre', type: 'text', required: true },
      { name: 'position', label: 'Orden', type: 'number' },
      { name: 'published', label: 'Publicado', type: 'checkbox' },
    ],
  },
  {
    table: 'nav_items', label: 'Menú', orderBy: { column: 'position' },
    listColumns: ['label', 'href', 'visible'], defaults: { area: 'menu', visible: true },
    fields: [
      { name: 'area', label: 'Zona', type: 'select', options: ['menu', 'recursos'], required: true },
      { name: 'label', label: 'Etiqueta', type: 'text', required: true },
      { name: 'href', label: 'Enlace', type: 'text', required: true },
      { name: 'position', label: 'Orden', type: 'number' },
      { name: 'visible', label: 'Visible', type: 'checkbox' },
    ],
  },
  {
    table: 'site_settings', label: 'Ajustes', orderBy: { column: 'site' },
    listColumns: ['site', 'updated_at'],
    fields: [
      { name: 'data', label: 'Ajustes (JSON)', type: 'json', required: true, help: 'Ej.: {"tagline": "…", "networks": {"x": "", "instagram": "https://…", "linkedin": "https://…", "github": ""}}. Una red vacía se muestra como marcador pendiente.' },
    ],
  },
  {
    table: 'cv_documents', label: 'CV (es/en)', orderBy: { column: 'lang' },
    listColumns: ['lang', 'updated_at'], preview: true,
    fields: [
      { name: 'lang', label: 'Idioma', type: 'select', options: LANGS, required: true },
      { name: 'data', label: 'Contenido (JSON)', type: 'json', required: true, help: 'Privado: no se publica en el sitio.' },
    ],
  },
];
