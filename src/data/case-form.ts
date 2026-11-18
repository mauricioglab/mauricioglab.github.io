// Formato fijo de los casos de estudio nuevos: qué campos pide el asistente en cada sección, con sus límites.
// El asistente arma el caso a partir de esto, así todos los casos de un mismo tipo se ven igual.
// Archivo IDÉNTICO en Mauricio y Fernanda.
import type { CaseType } from './case-model';
import type { BlockKind } from './case-templates';
import { ANALYST_FIELDS } from './analyst-overview';

export interface Slot {
  id: string;
  label: string;
  hint: string;
  example?: string;
  kind: BlockKind;
  required?: boolean;
  min?: number;        // cantidad mínima de ítems (lista, métricas, pasos, enlaces)
  max?: number;        // cantidad máxima de ítems
  maxChars?: number;   // largo máximo del texto principal de cada ítem
  maxTitle?: number;   // largo máximo del título de cada paso
  maxValue?: number;   // largo máximo del valor de una métrica
}

export interface FormSection {
  slots: Slot[];
  free?: boolean;      // sección de armado libre (no entra en el formato fijo)
}

// Límites de los datos generales del caso.
export const CASE_LIMITS = { title: 70, badge: 50, description: 170 } as const;

const DESARROLLO: Record<string, FormSection> = {
  resumen: {
    slots: [
      { id: 'cifras', kind: 'metricas', label: 'Cifras del proyecto', required: true, min: 3, max: 4, maxValue: 8, maxChars: 36,
        hint: 'Tres o cuatro datos que den la escala del proyecto: valor corto y qué mide.', example: '12 meses · +3.000 usuarios · 4 integraciones' },
    ],
  },
  problema: {
    slots: [
      { id: 'problema', kind: 'texto', label: 'El problema en una frase', required: true, maxChars: 240,
        hint: 'Qué necesitaba el cliente, dicho en términos de negocio (no de tecnología).', example: 'La empresa validaba identidades a mano y tardaba días en habilitar a cada cliente.' },
      { id: 'trabas', kind: 'lista', label: 'Qué lo trababa', required: true, min: 2, max: 3, maxChars: 90,
        hint: 'Dos o tres obstáculos concretos, uno por línea.', example: 'Datos en planillas sueltas' },
    ],
  },
  proceso: {
    slots: [
      { id: 'fases', kind: 'pasos', label: 'Mi proceso en cuatro fases', required: true, min: 4, max: 4, maxTitle: 30, maxChars: 150,
        hint: 'Cuatro fases en orden, cada una con un título corto y una frase de lo que se hizo.', example: 'Relevamiento — Entrevisté a los usuarios y mapeé el flujo actual.' },
    ],
  },
  solucion: {
    slots: [
      { id: 'solucion', kind: 'texto', label: 'La solución en una frase', required: true, maxChars: 300,
        hint: 'Qué se construyó y cómo, sin entrar en el detalle de cada módulo.' },
      { id: 'diagrama', kind: 'diagrama', label: 'Diagrama o captura principal', required: true, maxChars: 140,
        hint: 'La imagen que mejor explica la solución (arquitectura, flujo o pantalla), con un pie que diga qué mirar.' },
      { id: 'decisiones', kind: 'lista', label: 'Decisiones clave', min: 2, max: 4, maxChars: 100,
        hint: 'Decisiones de diseño o de alcance que valga la pena defender en una entrevista.' },
    ],
  },
  resultados: {
    slots: [
      { id: 'metricas', kind: 'metricas', label: 'Resultados medibles', required: true, min: 2, max: 4, maxValue: 8, maxChars: 40,
        hint: 'Impacto verificable. Si no hay cifras confirmadas, usá hechos comprobables (entregado, en uso, usuarios).', example: '-40% · tiempo de alta' },
      { id: 'lectura', kind: 'texto', label: 'Lectura de los resultados', maxChars: 200,
        hint: 'Opcional: una frase que ponga las cifras en contexto.' },
    ],
  },
  tecnologias: {
    slots: [
      { id: 'stack', kind: 'lista', label: 'Tecnologías usadas', required: true, min: 3, max: 10, maxChars: 24,
        hint: 'Una por línea, solo las que importan.', example: '.NET 8' },
      { id: 'enlaces', kind: 'enlaces', label: 'Demo y código', min: 0, max: 3, maxChars: 40,
        hint: 'Opcional: enlaces públicos al proyecto, a su demo o a su código.' },
    ],
  },
};

const ANALISTA: Record<string, FormSection> = Object.fromEntries(ANALYST_FIELDS.map((field) => {
  if (field.key === 'analisis-documentacion') return [field.key, { free: true, slots: [] } as FormSection];
  const slot: Slot = { id: field.key, kind: field.kind, label: field.es, hint: field.hint, required: true };
  if (field.kind === 'texto') slot.maxChars = 220;
  if (field.kind === 'diagrama') slot.maxChars = 140;
  if (field.kind === 'enlaces') { slot.min = 3; slot.max = 6; slot.maxChars = 40; }
  return [field.key, { slots: [slot] } as FormSection];
}));

export const FORM: Record<CaseType, Record<string, FormSection>> = { desarrollo: DESARROLLO, analista: ANALISTA };
