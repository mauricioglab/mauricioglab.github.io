// Ficha pública de un caso de estudio (prototipo): solo texto breve, evidencias y destinos. NADA del contenido extenso:
// las 14 secciones originales viven en la base (project_cases) y se descargan como PDF (public/downloads/<caso>/;
// en producción, archivos subidos al bucket `blog-files` desde el CMS).
//
// Pendientes de información real (no se muestran en la página; hay que pedirlos a Mauricio):
// - Su rol y responsabilidades concretas (la metodología lista un «Analista Funcional» y el historial firma
//   «Analista Funcional/QA», pero no dice quién fue). Por eso no hay línea de «Participación».
// - Una decisión de análisis defendible y la alternativa descartada; resultados verificables; aprendizajes.
// - Si se usó IA: en qué tarea y cómo se verificó.
// - Autorización para mostrar el nombre real del cliente.

const D = '/downloads/mgd-arquitectura/';
const IMG = '/images/casos/arqstudio/';

export interface CaseEvidence { title: string; text: string; img?: string; alt?: string; quote?: string; items?: string; link: { label: string; href: string } }
export interface CaseFlowStep { title: string; text: string; href: string }
export interface CaseDownload { label: string; file: string; kind: string; mb: string }
export interface CaseCard {
  slug: string; title: string; kicker: string; context: string; problem: string;
  flow: CaseFlowStep[]; main: CaseEvidence[]; secondary: CaseEvidence[];
  docsIntro: string; downloads: CaseDownload[];
}

export const CASE_CARDS: Record<string, CaseCard> = {
  'caso-arquitectura': {
    slug: 'caso-arquitectura',
    title: 'Sistema de gestión para MGD Arquitectura',
    kicker: 'Caso de estudio · Análisis funcional · UML · DFD · Scrum · Jira',
    context: 'Proyecto aplicado a un estudio de arquitectura de Córdoba con tres socios.',
    problem: 'El estado de los proyectos, las tareas y los cobros se armaba cruzando planillas a mano, sin un seguimiento compartido ni un historial confiable para el cliente.',
    flow: [
      { title: 'Relevamiento', text: 'Entrevistas con los tres socios y revisión de sus planillas y documentos: cinco procesos formales.', href: D + 'mgd-arquitectura-01-contexto-y-alcance.pdf#page=6' },
      { title: 'Requerimientos', text: '59 historias de usuario con criterios de aceptación y 13 diagramas de casos de uso.', href: D + 'mgd-arquitectura-02-requerimientos.pdf#page=2' },
      { title: 'Modelado', text: 'Flujo de información, modelo de datos y estados de proyectos, tareas y cobros.', href: D + 'mgd-arquitectura-03-modelado-y-diseno.pdf#page=2' },
      { title: 'Validación', text: 'Plan de pruebas con QA y pruebas con los tres arquitectos del estudio.', href: D + 'mgd-arquitectura-04-ejecucion-y-validacion.pdf#page=60' },
    ],
    main: [
      { title: 'Procesos del negocio', img: IMG + 'procesos-02.svg', alt: 'Diagrama de flujo del proceso de propuesta y cotización',
        text: 'Cómo trabajaba el estudio antes del sistema: de la propuesta y la cotización a la aceptación y el pago de la seña.',
        link: { label: 'Ver los cinco procesos relevados', href: D + 'mgd-arquitectura-01-contexto-y-alcance.pdf#page=9' } },
      { title: 'Casos de uso', img: IMG + 'requerimientos-05.svg', alt: 'Casos de uso del usuario interno: proyectos y tipología',
        text: 'Lo que puede hacer el usuario interno con los proyectos: registrarlos, clasificarlos, imprimir su informe y exportar el listado.',
        link: { label: 'Ver los 13 diagramas de casos de uso', href: D + 'mgd-arquitectura-02-requerimientos.pdf#page=11' } },
      { title: 'Flujo de información (DFD nivel 1)', img: IMG + 'modelado-01.svg', alt: 'DFD de nivel 1',
        text: 'Entidades externas, cinco procesos y almacenes de datos, antes de diseñar el modelo de datos.',
        link: { label: 'Ver el modelado completo', href: D + 'mgd-arquitectura-03-modelado-y-diseno.pdf#page=6' } },
    ],
    secondary: [
      { title: 'Historia de usuario', quote: 'Como administrativo del estudio, quiero registrar los datos de contacto de un cliente nuevo, para tener su información centralizada.',
        text: 'HU-001, con sus criterios de aceptación.',
        link: { label: 'Ver las 59 historias de usuario', href: D + 'mgd-arquitectura-02-requerimientos.pdf#page=3' } },
      { title: 'Seguimiento de sprint', img: IMG + 'sprints-01.svg', alt: 'Burndown del Sprint 1: esperado contra real',
        text: 'Avance real contra lo esperado en el Sprint 1. Hay un gráfico por iteración.',
        link: { label: 'Ver los gráficos de seguimiento', href: D + 'mgd-arquitectura-04-ejecucion-y-validacion.pdf#page=56' } },
      { title: 'Plan de pruebas', items: 'Accesos · panel · clientes · usuarios · tipologías · proyectos · servicios',
        text: 'Casos por módulo y criterios de aceptación, con pruebas de usuario.',
        link: { label: 'Ver las pruebas del sistema', href: D + 'mgd-arquitectura-04-ejecucion-y-validacion.pdf#page=60' } },
    ],
    docsIntro: 'Las 14 secciones originales, completas y sin recortes, en cuatro documentos.',
    downloads: [
      { label: 'Contexto, procesos y alcance', file: 'mgd-arquitectura-01-contexto-y-alcance.pdf', kind: 'PDF', mb: '0,4 MB' },
      { label: 'Requerimientos y funcionalidades', file: 'mgd-arquitectura-02-requerimientos.pdf', kind: 'PDF', mb: '0,5 MB' },
      { label: 'Modelado y diseño', file: 'mgd-arquitectura-03-modelado-y-diseno.pdf', kind: 'PDF', mb: '0,4 MB' },
      { label: 'Metodología, ejecución y validación', file: 'mgd-arquitectura-04-ejecucion-y-validacion.pdf', kind: 'PDF', mb: '1,4 MB' },
      { label: 'Documentación completa', file: 'mgd-arquitectura-documentacion-completa.pdf', kind: 'PDF', mb: '2,4 MB' },
      { label: 'Diagramas originales', file: 'mgd-arquitectura-diagramas-originales.zip', kind: 'ZIP', mb: '0,04 MB' },
    ],
  },
};

// Versión compacta del caso para la ventana (modal) del portafolio: usa los mismos tipos de bloque que el CMS
// (texto, subtítulo, pasos, diagrama, enlaces), así que al cargarlo desde el panel no hace falta código. Mientras
// tanto, en el prototipo reemplaza al caso completo (que sigue intacto en la base y en los PDF).
import type { CaseStudy, Block } from './case-model';

export function compactCase(c: CaseStudy): CaseStudy {
  const k = CASE_CARDS[c.slug];
  // CASE_FULL=1 devuelve el caso completo (lo usa el script que genera los PDF a partir del contenido cargado).
  if (!k || (typeof process !== 'undefined' && process.env.CASE_FULL === '1')) return c;
  const ev = (e: CaseEvidence): Block[] => [
    { kind: 'subtitulo', text: e.title },
    ...(e.img ? [{ kind: 'diagrama', url: e.img, alt: e.alt ?? e.title, caption: e.text } as Block]
      : [{ kind: 'texto', text: e.quote ? `«${e.quote}»` : (e.items ?? '') } as Block, { kind: 'texto', text: e.text } as Block]),
    { kind: 'enlaces', items: [{ label: `${e.link.label} →`, url: e.link.href }] },
  ];
  return {
    slug: c.slug,
    type: c.type,
    title: k.title,
    badge: 'Caso de estudio · Análisis funcional',
    description: k.context,
    sections: [
      { key: 'resumen', title: 'Resumen', blocks: [
        { kind: 'texto', text: k.problem },
        { kind: 'pasos', steps: k.flow.map((s) => ({ title: s.title, text: s.text, items: [] })) },
      ] },
      { key: 'evidencias', title: 'Evidencias', blocks: [...k.main, ...k.secondary].flatMap(ev) },
      { key: 'documentacion', title: 'Documentación completa', blocks: [
        { kind: 'texto', text: k.docsIntro },
        { kind: 'enlaces', items: k.downloads.map((d) => ({ label: `${d.label} (${d.kind}, ${d.mb})`, url: `${D}${d.file}` })) },
      ] },
    ],
  };
}
