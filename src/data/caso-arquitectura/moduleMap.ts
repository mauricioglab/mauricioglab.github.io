/**
 * Requerimientos y Alcances comparten exactamente los mismos 10 nombres de módulo, en el
 * mismo orden, así que cruzarlos es directo. Funcionalidades agrupa el mismo trabajo en 9
 * módulos con otro nivel de detalle (separa Clientes de Usuarios, une Proyectos con
 * Tipología, junta ambos gráficos en "Gráficos de progreso"), por lo que este mapa hace de
 * puente entre un lado y el otro para la trazabilidad entre capítulos.
 */

const DIACRITICS = new RegExp('[̀-ͯ]', 'g');

export function slug(s: string): string {
  return s
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const FUNC_BY_CANONICAL: Record<string, string[]> = {
  'Cuentas de usuario y cliente': ['Clientes', 'Usuarios'],
  'Proyectos y tipología': ['Proyectos', 'Tipología'],
  'Estadísticas generales': [],
  'Servicios y tareas de servicio': ['Servicios'],
  'Tareas del proyecto': ['Tareas del proyecto'],
  'Gráfico de avance de tareas': ['Tareas del proyecto'],
  'Cobros': ['Cobros'],
  'Gráficos de Gantt y PERT': ['Gráficos de progreso'],
  'Portal del cliente': ['Portal del cliente'],
  'Estadísticas y reportes gráficos': ['Gráficos de progreso'],
};

export const CANONICAL_BY_FUNC: Record<string, string[]> = Object.entries(FUNC_BY_CANONICAL)
  .reduce((out, [canonical, funcs]) => {
    for (const f of funcs) out[f] = [...(out[f] ?? []), canonical];
    return out;
  }, {} as Record<string, string[]>);
