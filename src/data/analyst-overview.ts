import type { Block, Lang, Section } from './case-model';

export const ANALYST_FIELDS = [
  { key: 'analisis-problema', es: 'Problema', en: 'Problem', kind: 'texto', hint: 'Describí en una frase qué necesitaba resolver el cliente.' },
  { key: 'analisis-solucion', es: 'Solución', en: 'Solution', kind: 'texto', hint: 'Resumí la solución en una frase.' },
  { key: 'analisis-validacion', es: 'Validación', en: 'Validation', kind: 'texto', hint: 'Contá qué se validó y con quién. Usá solo hechos comprobados.' },
  { key: 'analisis-relevamiento', es: 'Relevamiento', en: 'Discovery', kind: 'diagrama', hint: 'Agregá un diagrama de procesos y un pie breve que indique qué mirar.' },
  { key: 'analisis-requerimientos', es: 'Requerimientos', en: 'Requirements', kind: 'diagrama', hint: 'Mostrá un caso de uso u otra evidencia de los requerimientos.' },
  { key: 'analisis-modelado', es: 'Modelado', en: 'Modeling', kind: 'diagrama', hint: 'Agregá un modelo o un recorte que se pueda leer en el modal.' },
  { key: 'analisis-entregables', es: 'Entregables destacados', en: 'Featured deliverables', kind: 'enlaces', hint: 'Cada enlace abre la categoría completa de un entregable. Pegá la URL del PDF, la página o el ZIP.' },
  { key: 'analisis-documentacion', es: 'Documentación técnica completa', en: 'Technical documentation', kind: 'enlaces', hint: 'Agregá un subtítulo por documento y debajo un bloque de enlaces a sus secciones y al PDF. Los enlaces sin subtítulo aparecen como descargas generales.' },
] as const;

const keys = new Set<string>(ANALYST_FIELDS.map(({ key }) => key));
export const isAnalystField = (key: string) => keys.has(key);

type Link = Extract<Block, { kind: 'enlaces' }>['items'][number];
type Diagram = Extract<Block, { kind: 'diagrama' }>;

function publicLink(url: string) {
  return /^(?:https?:\/\/|\/(?![\/\\]))/i.test(url);
}

export function getAnalystOverview(sections: Section[], lang: Lang) {
  const entries = new Map(sections.map((section) => [section.key, section]));
  const title = (field: typeof ANALYST_FIELDS[number]) => entries.get(field.key)?.title || field[lang];
  const blocks = (field: typeof ANALYST_FIELDS[number]) => entries.get(field.key)?.blocks ?? [];
  const summary = ANALYST_FIELDS.slice(0, 3).flatMap((field) => blocks(field)
    .filter((block): block is Extract<Block, { kind: 'texto' }> => block.kind === 'texto' && Boolean(block.text.trim()))
    .map((block) => ({ title: title(field), text: block.text })));
  const analysis = ANALYST_FIELDS.slice(3, 6).flatMap((field) => blocks(field)
    .filter((block): block is Diagram => block.kind === 'diagrama' && publicLink(block.url))
    .map((diagram) => ({ title: title(field), diagram })));
  const deliverablesField = ANALYST_FIELDS[6];
  const documentsField = ANALYST_FIELDS[7];
  const getLinks = (block: Extract<Block, { kind: 'enlaces' }>) => block.items.filter((item) => publicLink(item.url));
  const deliverables = blocks(deliverablesField).flatMap((block) => block.kind === 'enlaces' ? getLinks(block) : []);
  const documents: { title: string; links: Link[] }[] = [];
  const downloads: Link[] = [];
  let group: { title: string; links: Link[] } | undefined;
  for (const block of blocks(documentsField)) {
    if (block.kind === 'subtitulo' && block.text.trim()) {
      group = { title: block.text, links: [] };
      documents.push(group);
    } else if (block.kind === 'enlaces') {
      (group?.links ?? downloads).push(...getLinks(block));
    }
  }
  const nonempty = documents.filter(({ links }) => links.length > 0);
  if (!summary.length && !analysis.length && !deliverables.length && !nonempty.length && !downloads.length) return null;
  return {
    summary, analysis, deliverables, documents: nonempty, downloads,
    deliverablesTitle: title(deliverablesField),
    documentsTitle: title(documentsField),
  };
}