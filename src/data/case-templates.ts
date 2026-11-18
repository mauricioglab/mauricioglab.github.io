// Plantillas de secciones por tipo de caso. El asistente del panel recorre estas secciones en orden.
// Archivo IDÉNTICO en Mauricio y Fernanda.
import type { CaseType } from './case-model';
import { ANALYST_FIELDS } from './analyst-overview';

export type BlockKind = 'texto' | 'subtitulo' | 'lista' | 'pasos' | 'metricas' | 'tabla' | 'diagrama' | 'enlaces';

export interface SectionTemplate { key: string; title: string; title_en: string; hint: string; kinds: BlockKind[] }

export const CASE_TYPES: { id: CaseType; label: string; hint: string }[] = [
  { id: 'desarrollo', label: 'Desarrollo', hint: 'Problema, proceso, solución y resultados de un proyecto de software o de datos.' },
  { id: 'analista', label: 'Analista', hint: 'Modal de análisis funcional con resumen, diagramas, entregables e índice de documentos.' },
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
  analista: ANALYST_FIELDS.map((field) => ({
    key: field.key,
    title: field.es,
    title_en: field.en,
    hint: field.hint,
    kinds: field.key === 'analisis-documentacion' ? ['subtitulo', 'enlaces'] : [field.kind],
  })),
};
