import type { Chapter } from './types';
import { STUDIO_NAME, PRODUCT_NAME } from './brand';

export const chapterGroups = [
  '01 · Contexto',
  '02 · Relevamiento',
  '03 · Problema',
  '04 · Factibilidad',
  '05 · Objetivos y alcance',
  '06 · Requerimientos',
  '07 · Modelado',
  '08 · Diseño',
  '09 · Gestión',
  '10 · Construcción y validación',
  'Anexo',
] as const;

export const chapters: Chapter[] = [
  { n: '01', href: '/caso-arquitectura/organizacion', title: STUDIO_NAME, desc: 'Quiénes son, cómo se organizan y bajo qué políticas, planes y reglas de negocio trabajan.', group: chapterGroups[0] },
  { n: '02', href: '/caso-arquitectura/procesos', title: 'Procesos involucrados', desc: 'Cómo se relevó el estudio y los cinco procesos formales que resultaron, con sus bifurcaciones reales y su diagrama de flujo.', group: chapterGroups[1] },
  { n: '03', href: '/caso-arquitectura/impulsos', title: 'Impulsos del proyecto', desc: `El problema, la necesidad y la oportunidad que motivaron construir ${PRODUCT_NAME}.`, group: chapterGroups[2] },
  { n: '04', href: '/caso-arquitectura/factibilidad', title: 'Estudio de factibilidad', desc: 'Condiciones del estudio para afrontar el proyecto: técnica, económica, operativa y legal.', group: chapterGroups[3] },
  { n: '05', href: '/caso-arquitectura/objetivos-alcance', title: 'Objetivos y alcance', desc: `La solución planteada, sus dos objetivos y hasta dónde llega cada módulo de ${PRODUCT_NAME}.`, group: chapterGroups[4] },
  { n: '06', href: '/caso-arquitectura/requerimientos', title: 'Requerimientos', desc: 'Cada módulo del sistema se traduce en historias de usuario y casos de uso, con sus criterios de aceptación correspondientes.', group: chapterGroups[5] },
  { n: '07', href: '/caso-arquitectura/funcionalidades', title: 'Funcionalidades', desc: `El catálogo de capacidades que ${PRODUCT_NAME} efectivamente entrega, módulo por módulo.`, group: chapterGroups[5] },
  { n: '08', href: '/caso-arquitectura/modelado', title: 'Modelado', desc: 'El flujo de datos, el modelo de datos, la transición de estados y el diccionario que lo traduce a lenguaje de negocio.', group: chapterGroups[6] },
  { n: '09', href: '/caso-arquitectura/diseno', title: 'Diseño', desc: 'El stack, las decisiones de arquitectura, las clases y el despliegue del sistema.', group: chapterGroups[7] },
  { n: '10', href: '/caso-arquitectura/metodologia', title: 'Metodología', desc: 'Cómo trabajó el equipo bajo Scrum: roles, ceremonias, backlog, costos y riesgos del proyecto.', group: chapterGroups[8] },
  { n: '11', href: '/caso-arquitectura/sprints', title: 'Sprints', desc: '13 iteraciones Scrum con su backlog, estimaciones y burndown de avance real.', group: chapterGroups[9] },
  { n: '12', href: '/caso-arquitectura/pruebas', title: 'Pruebas del sistema', desc: 'Casos de prueba, plan de testing, ejecución y documentación de resultados.', group: chapterGroups[9] },
  { n: '13', href: '/caso-arquitectura/implementacion', title: 'Implementación', desc: 'El ambiente de despliegue, la puesta en marcha y la capacitación del sistema.', group: chapterGroups[9] },
  { n: '14', href: '/caso-arquitectura/historial', title: 'Historial de revisión', desc: 'Bitácora completa del proyecto: cada hito de versión, de punta a punta.', group: chapterGroups[10] },
];
