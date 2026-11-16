// Módulos del administrador de Mauricio: un solo lugar para el gestor anterior y el CMS de contenido.
import AdminShell, { type AdminModule } from './AdminShell';
import AbmResource from './AbmResource';
import ResumenPanel from './ResumenPanel';
import BlogModule from './BlogModule';
import DisertacionesAdminPreact from './DisertacionesAdminPreact';
import RecursosAdminPreact from './RecursosAdminPreact';
import MovimientoAdminPreact from './MovimientoAdminPreact';
import { RESOURCES } from '../../data/admin-resources';
import { SITE_CONFIG } from '../../data/config';

const go = (id: string) => { location.hash = id; };

const GROUP_OF: Record<string, string> = { cv_documents: 'Privado' };

const modules: AdminModule[] = [
  { id: 'resumen', group: 'Inicio', label: 'Resumen y enlaces', render: () => <ResumenPanel go={go} /> },
  { id: 'blog', group: 'Publicaciones', label: 'Blog', render: () => <BlogModule /> },
  { id: 'disertaciones', group: 'Publicaciones', label: 'Eventos', render: () => <DisertacionesAdminPreact /> },
  { id: 'recursos', group: 'Publicaciones', label: 'Zona Lab', render: () => <RecursosAdminPreact /> },
  { id: 'movimiento', group: 'Herramientas', label: 'Movimiento', render: () => <MovimientoAdminPreact /> },
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
