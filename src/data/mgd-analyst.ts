import { CASE_CARDS } from './case-meta';
import type { RawSection } from './case-model';
import { ANALYST_FIELDS } from './analyst-overview';

export const MGD_SLUG = 'caso-arquitectura';
const card = CASE_CARDS[MGD_SLUG];
const [process, useCase, model] = card.main;
const [context, requirements, design, execution, ...archive] = card.downloads;
const root = '/downloads/mgd-arquitectura/';

const sections = [
  [{ kind: 'texto', text: 'El estudio cruzaba planillas para seguir proyectos, tareas y cobros.' }],
  [{ kind: 'texto', text: 'Un sistema para centralizar ese seguimiento.' }],
  [{ kind: 'texto', text: 'Los tres arquitectos probaron proyectos, tareas y registro de usuarios.' }],
  [{ kind: 'diagrama', url: process.img, alt: process.alt, caption: 'El estudio pasaba a obra cuando el cliente aceptaba la propuesta y pagaba la seña.' }],
  [{ kind: 'diagrama', url: useCase.img, alt: useCase.alt, caption: 'Al registrar un proyecto, el equipo debía vincularlo a un cliente y asignarle una tipología.' }],
  [{ kind: 'diagrama', url: model.img, alt: model.alt, caption: 'El DFD muestra cómo la propuesta aceptada pasa al registro de proyectos.' }],
  [{ kind: 'enlaces', items: [
    { label: 'Procesos', url: root + context.file + '#page=6' },
    { label: 'Casos de uso', url: root + requirements.file + '#page=11' },
    { label: 'Requerimientos', url: root + requirements.file + '#page=2' },
    { label: 'Modelado', url: root + design.file + '#page=2' },
    { label: 'Sprints', url: root + execution.file + '#page=7' },
    { label: 'Pruebas', url: root + execution.file + '#page=60' },
  ] }],
  [
    { kind: 'enlaces', items: archive.map((doc) => ({ label: doc.label + ' (' + doc.kind + ')', url: root + doc.file })) },
    ...[
      { doc: context, entries: [['La organización', 2], ['Procesos involucrados', 6], ['Impulsos del proyecto', 13], ['Estudio de factibilidad', 14], ['Objetivos y alcance', 16]] },
      { doc: requirements, entries: [['Requerimientos', 2], ['Funcionalidades', 23]] },
      { doc: design, entries: [['Modelado', 2], ['Diseño', 9]] },
      { doc: execution, entries: [['Metodología', 2], ['Sprints', 7], ['Pruebas del sistema', 60], ['Implementación', 63], ['Historial de revisión', 65]] },
    ].flatMap(({ doc, entries }) => ([
      { kind: 'subtitulo' as const, text: doc.label },
      { kind: 'enlaces' as const, items: [
        ...entries.map(([label, page]) => ({ label: String(label), url: root + doc.file + '#page=' + page })),
        { label: 'Abrir PDF completo', url: root + doc.file },
      ] },
    ])),
  ],
] satisfies NonNullable<RawSection['blocks']>[];

export const mgdAnalystSections: RawSection[] = ANALYST_FIELDS.map((field, i) => ({
  key: field.key, title: field.es, title_en: field.en, blocks: sections[i],
}));

// These crops match the original diagram files. Images from the CMS use their full bounds.
export const mgdDiagramCrops: Record<string, { width: number; height: number; viewBox: string }> = {
  [process.img!]: { width: 420, height: 614, viewBox: '0 326 420 288' },
  [useCase.img!]: { width: 424, height: 416, viewBox: '0 0 424 251' },
  [model.img!]: { width: 778, height: 284, viewBox: '276 0 502 134' },
};