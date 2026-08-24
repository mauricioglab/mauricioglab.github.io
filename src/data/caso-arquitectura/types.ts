// Convención de nombres: los campos que reflejan una clave del JSON de origen
// van en snake_case español (p. ej. `objetivo_organizacional`). Los props de
// componentes que no vienen de un JSON (p. ej. ActorNegocio, o las interfaces
// de los componentes de diagramas) siguen camelCase estándar.

export type FlowShape = 'stadium' | 'rect' | 'parallelogram' | 'hex' | 'doc' | 'diamond';

export interface FlowNode {
  shape: FlowShape;
  label: string;
}

export interface FlowBranch {
  label: string;
  nodes: FlowNode[];
}

export interface FlowDecision {
  question: string;
  branches: FlowBranch[];
  merge?: FlowNode;
}

export type FlowStep =
  | { kind: 'node'; node: FlowNode }
  | { kind: 'decision'; decision: FlowDecision };

export interface Chapter {
  n: string;
  href: string;
  title: string;
  desc: string;
  group: string;
}

export interface ActorNegocio {
  actor: string;
  rolSistema: string;
  hoy: string;
  conSistema: string;
}

export interface ReglaNegocio {
  id: string;
  regla: string;
  implementacion: string;
  violacion: string;
  origen: string;
  validado_por: string;
}

export interface Organizacion {
  intro: string[];
  objetivo_organizacional: string[];
  politicas_intro: string[];
  politicas: { title: string; paragraphs: string[] }[];
  estrategias: { texto: string; horizonte: string }[];
  planes: { texto: string; horizonte: string; impacto: string }[];
  funcionamiento: string[];
  actores: ActorNegocio[];
  actores_nota: string[];
  reglas_negocio: ReglaNegocio[];
}

export interface Proceso {
  nombre: string;
  evento_inicio: string;
  objetivo: string;
  actividades: string[];
  participantes?: string;
  recursos?: string;
  documentos?: string;
  flow: FlowStep[];
}

export interface Impulso {
  tema: string;
  problema: string;
  necesidad: string;
  oportunidad: string;
}

export interface Impulsos {
  items: Impulso[];
}

export interface Propuesta {
  propuesta: string[];
  objetivo_proyecto: string[];
  objetivo_producto: string[];
}

export interface Requerimiento {
  id: string;
  epica: string;
  historia: string;
  criterios: string;
  puntos: number;
}

export interface RequerimientoModulo {
  modulo: string;
  descripcion: string;
  origen: string;
  necesidad_origen: string;
  cobertura_pruebas: string;
  requerimientos: Requerimiento[];
}

export interface StoryMapActividad {
  actividad: string;
  tareas: string[];
  rango: string;
}

export interface StoryMapFueraDeAlcance {
  item: string;
  nota: string;
}

export interface StoryMap {
  actividades: StoryMapActividad[];
  fuera_de_alcance: StoryMapFueraDeAlcance[];
}

export interface RequerimientosData {
  dor: string[];
  dod: string[];
  modulos: RequerimientoModulo[];
  story_map: StoryMap;
}

export interface AlcanceModulo {
  modulo: string;
  incluye: string[];
}

export interface FuncionalidadModulo {
  modulo: string;
  descripcion: string;
  capacidades: string[];
}

export interface FactibilidadPunto {
  titulo: string;
  texto: string;
}

export interface Factibilidad {
  tecnica: FactibilidadPunto[];
  economica: FactibilidadPunto[];
  operativa: FactibilidadPunto[];
  legal: FactibilidadPunto[];
}

export interface CostosIlustrativos {
  intro: string;
  disclaimer: string;
  tabla_mercado: string[][];
  referencia_cpcipc: { valor: string; fuente: string; nota: string };
}

export interface MetodologiaRol {
  rol: string;
  responsabilidad: string;
  conexion: string;
}

export interface MetodologiaCeremonia {
  nombre: string;
  proposito: string;
  detalle: {
    intro: string;
    items: string[];
  };
}

export interface MetodologiaArtefacto {
  nombre: string;
  descripcion: string;
  conexion: string;
}

export interface Metodologia {
  texto: string[];
  roles: MetodologiaRol[];
  ceremonias: MetodologiaCeremonia[];
  artefactos: MetodologiaArtefacto[];
  cadencia: string[];
  costos_ilustrativos: CostosIlustrativos;
  riesgos_estimacion: FactibilidadPunto[];
}

export interface TecnologiaCapa {
  title: string;
  paragraphs: string[];
}

export interface TecnologiaSolid {
  principio: string;
  aplicacion: string;
}

export interface TecnologiaDiseno {
  der: {
    intro: string;
    relaciones: string[];
    tabla: string[][];
  };
  clases: string[];
  paquetes: string[];
  estados: string[];
}

export interface TecnologiaAdr {
  id: string;
  titulo: string;
  estado: string;
  contexto: string[];
  decision: string[];
  consecuencias: string[];
}

export interface DiccionarioCampo {
  campo: string;
  tipo: string;
  obligatorio: string;
  unico: string;
  ejemplo: string;
  descripcion: string;
}

export interface DiccionarioEntidad {
  entidad: string;
  campos: DiccionarioCampo[];
}

export interface Modelado {
  der: TecnologiaDiseno['der'];
  diccionario_datos: DiccionarioEntidad[];
  estados: TecnologiaDiseno['estados'];
}

export interface Diseno {
  tabla_tecnologias: string[][];
  arquitectura: {
    intro: string[];
    capas: TecnologiaCapa[];
    solid: TecnologiaSolid[];
  };
  adr: TecnologiaAdr[];
  clases: TecnologiaDiseno['clases'];
  paquetes: TecnologiaDiseno['paquetes'];
  herramientas_desarrollo: string[];
  librerias_frontend: string[];
}

export interface TecnicaRelevamiento {
  tecnica: string;
  descripcion: string;
  aporte: string;
}

export interface Relevamiento {
  intro: string;
  tecnicas: TecnicaRelevamiento[];
}

export type SprintCeremonia =
  | 'PLANIFICACION'
  | 'REVISION'
  | 'RETROSPECTIVA'
  | 'REFINAMIENTO';

export interface SprintCeremoniaDetalle {
  intro: string;
  items: string[];
}

export interface SprintCeremonias {
  PLANIFICACION?: string | SprintCeremoniaDetalle;
  REVISION?: string | SprintCeremoniaDetalle;
  RETROSPECTIVA?: string | SprintCeremoniaDetalle;
  REFINAMIENTO?: string | SprintCeremoniaDetalle;
}

export interface Sprint {
  numero: string;
  objetivo: string;
  backlog: string[];
  estimacion: string[][];
  ceremonias: SprintCeremonias;
  reuniones: string[][];
  metricas_texto: string[];
  metricas_tabla: string[][];
  historia_usuario: string[][];
}

export interface Pruebas {
  intro: string[];
  casos_prueba: string[];
  plan_pruebas: string[];
  ejecucion: string[];
  documentacion_resultado: string[];
}

export interface HistorialEntry {
  fecha: string;
  motivo: string;
  autor: string;
  version: string;
}

export interface Implementacion {
  ambiente: string[];
  texto: string[];
  capacitacion: {
    objetivo: string;
    modalidad: string[];
    evaluacion: string[];
  };
}
