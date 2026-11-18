// Módulos del administrador de Mauricio: un solo lugar para el gestor anterior y el CMS de contenido.
import AdminShell, { type AdminModule } from './AdminShell';
import AbmResource from './AbmResource';
import SocialsEditor from './SocialsEditor';
import SectionsEditor from './SectionsEditor';
import ResumenPanel from './ResumenPanel';
import BlogModule from './BlogModule';
import CasesModule from './CasesModule';
import DisertacionesAdminPreact from './DisertacionesAdminPreact';
import RecursosAdminPreact from './RecursosAdminPreact';
import { RESOURCES } from '../../data/admin-resources';
import { SITE_CONFIG } from '../../data/config';

const go = (id: string) => { location.hash = id; };

const GROUP_OF: Record<string, string> = { cv_documents: 'Privado' };

const modules: AdminModule[] = [
  { id: 'resumen', group: 'Inicio', label: 'Resumen y enlaces', render: () => <ResumenPanel go={go} /> },
  { id: 'blog', group: 'Publicaciones', label: 'Blog', render: () => <BlogModule /> },
  { id: 'casos', group: 'Publicaciones', label: 'Casos de estudio', render: () => <CasesModule /> },
  { id: 'disertaciones', group: 'Publicaciones', label: 'Eventos', render: () => <DisertacionesAdminPreact /> },
  { id: 'recursos', group: 'Publicaciones', label: 'Zona Lab', render: () => <RecursosAdminPreact /> },
  { id: 'secciones', group: 'Contenido del sitio', label: 'Secciones', render: () => <SectionsEditor siteId={SITE_CONFIG.siteId} items={[{ key: 'eventos', label: 'Eventos' }, { key: 'recursos', label: 'Zona Lab' }, { key: 'curiosidades', label: 'Curiosidades', hint: 'Enlace en el pie hacia el juego del mate y el rincón retro.' }]} /> },
  { id: 'redes', group: 'Contenido del sitio', label: 'Redes sociales', render: () => <SocialsEditor siteId={SITE_CONFIG.siteId} /> },
  ...RESOURCES.map((r) => ({
    id: r.table,
    group: GROUP_OF[r.table] ?? 'Contenido del sitio',
    label: r.label,
    render: () => <AbmResource siteId={SITE_CONFIG.siteId} resource={r} />,
  })),
];

export default function AdminApp() {
  return <AdminShell siteId={SITE_CONFIG.siteId} siteName={SITE_CONFIG.author} modules={modules} />;
}
