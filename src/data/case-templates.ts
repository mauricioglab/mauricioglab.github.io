// Plantillas de secciones por tipo de caso. El asistente del panel recorre estas secciones en orden.
// Archivo IDÉNTICO en Mauricio y Fernanda.
import type { CaseType } from './case-model';

export type BlockKind = 'texto' | 'subtitulo' | 'lista' | 'pasos' | 'metricas' | 'tabla' | 'diagrama' | 'enlaces';

export interface SectionTemplate { key: string; title: string; title_en: string; hint: string; kinds: BlockKind[] }

export const CASE_TYPES: { id: CaseType; label: string; hint: string }[] = [
  { id: 'desarrollo', label: 'Desarrollo', hint: 'Problema, proceso, solución y resultados de un proyecto de software o de datos.' },
  { id: 'analista', label: 'Analista', hint: 'Análisis de sistemas completo: relevamiento, requerimientos, modelado, diseño y gestión.' },
];

export const BLOCK_LABELS: Record<BlockKind, string> = {
  texto: 'Texto', subtitulo: 'Subtítulo', lista: 'Lista', pasos: 'Pasos o fases', metricas: 'Métricas', tabla: 'Tabla', diagrama: 'Diagrama / imagen', enlaces: 'Enlaces',
};

const ALL: BlockKind[] = ['texto', 'subtitulo', 'lista', 'pasos', 'metricas', 'tabla', 'diagrama', 'enlaces'];

export const TEMPLATES: Record<CaseType, SectionTemplate[]> = {
  desarrollo: [
    { key: 'resumen', title: 'Resumen', title_en: 'Summary', hint: 'Tres o cuatro cifras que resuman el proyecto.', kinds: ALL },
    { key: 'problema', title: 'El problema', title_en: 'The problem', hint: 'Qué necesitaba el cliente y qué lo trababa.', kinds: ALL },
    { key: 'proceso', title: 'Mi proceso', title_en: 'My process', hint: 'Fases en orden, con lo que se hizo en cada una.', kinds: ALL },
    { key: 'solucion', title: 'La solución', title_en: 'The solution', hint: 'Qué se construyó y cómo (arquitectura, decisiones, tecnologías).', kinds: ALL },
    { key: 'resultados', title: 'Resultados', title_en: 'Results', hint: 'Métricas e impacto medible.', kinds: ALL },
    { key: 'tecnologias', title: 'Tecnologías y enlaces', title_en: 'Technologies and links', hint: 'Stack usado y enlaces a demo o código.', kinds: ALL },
  ],
  analista: [
    { key: 'organizacion', title: 'La organización', title_en: 'The organization', hint: 'Quiénes son, cómo se organizan, políticas y reglas de negocio.', kinds: ALL },
    { key: 'procesos', title: 'Procesos involucrados', title_en: 'Business processes', hint: 'Cómo se relevó y qué procesos resultaron, con su diagrama de flujo.', kinds: ALL },
    { key: 'impulsos', title: 'Impulsos del proyecto', title_en: 'Project drivers', hint: 'El problema, la necesidad y la oportunidad.', kinds: ALL },
    { key: 'factibilidad', title: 'Estudio de factibilidad', title_en: 'Feasibility study', hint: 'Técnica, económica, operativa y legal.', kinds: ALL },
    { key: 'objetivos', title: 'Objetivos y alcance', title_en: 'Objectives and scope', hint: 'La solución planteada y hasta dónde llega.', kinds: ALL },
    { key: 'requerimientos', title: 'Requerimientos', title_en: 'Requirements', hint: 'Historias de usuario y casos de uso con criterios de aceptación.', kinds: ALL },
    { key: 'funcionalidades', title: 'Funcionalidades', title_en: 'Features', hint: 'El catálogo de capacidades, módulo por módulo.', kinds: ALL },
    { key: 'modelado', title: 'Modelado', title_en: 'Modeling', hint: 'Flujo de datos, modelo de datos, estados y diccionario (diagramas como imagen).', kinds: ALL },
    { key: 'diseno', title: 'Diseño', title_en: 'Design', hint: 'Stack, arquitectura, clases y despliegue.', kinds: ALL },
    { key: 'metodologia', title: 'Metodología', title_en: 'Methodology', hint: 'Roles, ceremonias, backlog, costos y riesgos.', kinds: ALL },
    { key: 'sprints', title: 'Sprints', title_en: 'Sprints', hint: 'Iteraciones con su backlog y avance.', kinds: ALL },
    { key: 'pruebas', title: 'Pruebas del sistema', title_en: 'System testing', hint: 'Casos de prueba, plan y resultados.', kinds: ALL },
    { key: 'implementacion', title: 'Implementación', title_en: 'Implementation', hint: 'Despliegue, puesta en marcha y capacitación.', kinds: ALL },
    { key: 'historial', title: 'Historial de revisión', title_en: 'Revision history', hint: 'Bitácora de versiones del proyecto.', kinds: ALL },
  ],
};
