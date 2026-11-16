// Módulo "Blog" del administrador: dos formas de trabajar sobre la misma tabla `blogs`.
//  - Gestor con IA: proponer ideas, redactar, revisar, portada y publicar (BlogAdminPreact).
//  - Editor simple: formulario limpio para escribir o corregir un post a mano (AbmResource).
// Archivo IDÉNTICO en los sitios de Mauricio y de Fernanda.
import { useState } from 'preact/hooks';
import BlogAdminPreact from './BlogAdminPreact';
import AbmResource, { type Resource } from './AbmResource';
import { SITE_ID, SITE_AUTHOR } from '../../data/site-id';

const BLOG_RESOURCE: Resource = {
  table: 'blogs',
  label: 'Editor simple',
  orderBy: { column: 'pub_date', ascending: false },
  listColumns: ['title', 'pub_date', 'draft'],
  defaults: { draft: true, author: SITE_AUTHOR },
  fields: [
    { name: 'title', label: 'Título', type: 'text', required: true },
    { name: 'slug', label: 'Dirección (slug)', type: 'text', required: true, help: 'Solo minúsculas, números y guiones.' },
    { name: 'pub_date', label: 'Fecha', type: 'date' },
    { name: 'author', label: 'Autor/a', type: 'text' },
    { name: 'categories', label: 'Categorías', type: 'tags', help: 'Separadas por coma.' },
    { name: 'topicos', label: 'Temas', type: 'tags', help: 'Separados por coma.' },
    { name: 'description', label: 'Resumen', type: 'textarea' },
    { name: 'body_markdown', label: 'Contenido (Markdown)', type: 'markdown' },
    { name: 'cover_url', label: 'Portada', type: 'image', bucket: 'blog-images' },
    { name: 'draft', label: 'Borrador (no se publica)', type: 'checkbox' },
  ],
};

export default function BlogModule() {
  const [mode, setMode] = useState<'ia' | 'simple'>('ia');
  return (
    <div class="pt-blog-module">
      <div class="pt-admin-tabs" role="tablist" aria-label="Modo de trabajo del blog">
        <button type="button" role="tab" aria-selected={mode === 'ia'} class={mode === 'ia' ? 'is-on' : ''} onClick={() => setMode('ia')}>Gestor con IA</button>
        <button type="button" role="tab" aria-selected={mode === 'simple'} class={mode === 'simple' ? 'is-on' : ''} onClick={() => setMode('simple')}>Editor simple</button>
      </div>
      {mode === 'ia' ? <BlogAdminPreact /> : <AbmResource siteId={SITE_ID} resource={BLOG_RESOURCE} />}
    </div>
  );
}
