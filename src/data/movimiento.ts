/**
 * Movimiento - datos unificados de las 5 modalidades.
 * Fallback local (el sitio es estático): `src/utils/movimiento.ts` consulta
 * Supabase en build time y usa estos datos si la DB no está disponible.
 * Los planes de thruster/remo provienen de tools-pyside (_PLAN_DATA) y las
 * rutinas de pausas/movilidad/entrenamiento de las páginas originales.
 */

export type ModalidadId = 'pausas' | 'movilidad' | 'entrenamiento' | 'remo' | 'thruster';

export interface Ejercicio {
  name: string;
  note?: string;
  cue?: string;
  /** Instrucciones dinámicas (active_breaks): se muestra la primera cuyo `hasta` >= segundos restantes */
  instrucciones?: { hasta?: number; texto: string }[];
  /** Referencia por link (YouTube/Drive) */
  url?: string;
  /** Referencia por GIF (nombre de archivo dentro de gifBase) */
  gif?: string;
  type: 'reps' | 'time';
}

export interface FaseDef {
  key: string;
  label: string;
  segundos: number;
}

export interface SemanaConfig {
  label: string;
  stars?: string;
  series: number;
  /** Valor por ejercicio (reps o seg según el type de cada ejercicio) */
  values: number[];
}

export interface ProgramaConfig {
  modo: 'circuito' | 'fases';
  series: number;
  /** Descanso entre vueltas (circuito) o entre series (fases) */
  restSegundos: number;
  banner: string;
  bannerNote?: string;
  doneMsg?: string;
  /** circuito: valor fijo para todos los ejercicios (pausas/movilidad) */
  reps?: number;
  /** fases: máquina de fases por repetición */
  fases?: FaseDef[];
  pesoKg?: number;
  /** fases: última serie sin límite de reps, termina manual */
  ultimaSerieInfinita?: boolean;
  /** entrenamiento: selector secundario de semana */
  semanas?: SemanaConfig[];
}

export interface ProgramaOpcion {
  key: string;
  label: string;
  emoji?: string;
  /** Fecha ISO para auto-selección de "hoy" (remo/thruster) */
  fecha?: string;
  config: ProgramaConfig;
  ejercicios: Ejercicio[];
}

export interface Programa {
  /** selector: clave del grupo (slot, momento, dia, fecha) */
  key: string;
  label: string;
  opciones: ProgramaOpcion[];
}

export interface ModalidadDef {
  id: ModalidadId;
  nombre: string;
  subtitulo: string;
  icono: string;
  acento: string;
  chipRest?: string;
  /** base para GIFs (entrenamiento) */
  gifBase?: string;
  programas: Programa[];
}

// ── Fases por repetición (portadas de thruster_timer_service.py) ──────────
const FASES_REP: FaseDef[] = [
  { key: 'prepare', label: 'PREPARATE', segundos: 5 },
  { key: 'down', label: 'BAJA', segundos: 3 },
  { key: 'hold', label: 'SOSTENE', segundos: 1 },
  { key: 'up', label: 'SUBE', segundos: 1.5 },
  { key: 'trans', label: 'ACOMODATE', segundos: 0.5 },
];

// ── Planes por fecha (portados de _PLAN_DATA del PySide) ──────────────────
// thruster: [fechas..., series, reps, peso] por bloque semanal (3 sesiones)
const THRUSTER_PLAN: [string[], number, number, number][] = [
  [['2026-02-07'], 3, 10, 5.5],
  [['2026-02-10', '2026-02-12', '2026-02-14'], 3, 11, 5.5],
  [['2026-02-17', '2026-02-19', '2026-02-21'], 3, 12, 5.5],
  [['2026-02-24', '2026-02-26', '2026-02-28'], 4, 10, 5.5],
  [['2026-03-02', '2026-03-04', '2026-03-06'], 4, 11, 5.5],
  [['2026-03-09', '2026-03-11', '2026-03-13'], 4, 12, 5.5],
  [['2026-03-16', '2026-03-18', '2026-03-20'], 4, 13, 5.5],
  [['2026-03-23', '2026-03-25', '2026-03-27'], 4, 14, 5.5],
  [['2026-03-30', '2026-04-01', '2026-04-03'], 4, 15, 5.5],
  [['2026-04-06', '2026-04-08', '2026-04-10'], 4, 6, 10.5],
  [['2026-04-13', '2026-04-15', '2026-04-17'], 4, 7, 10.5],
  [['2026-04-20', '2026-04-22', '2026-04-24'], 4, 8, 10.5],
  [['2026-04-27', '2026-04-29', '2026-05-01'], 4, 9, 10.5],
  [['2026-05-04', '2026-05-06', '2026-05-08'], 4, 10, 10.5],
  [['2026-05-11', '2026-05-13', '2026-05-15'], 4, 11, 10.5],
  [['2026-05-18', '2026-05-20', '2026-05-22'], 4, 12, 10.5],
  [['2026-05-25', '2026-05-27', '2026-05-29'], 4, 13, 10.5],
  [['2026-06-01', '2026-06-03', '2026-06-05'], 4, 14, 10.5],
  [['2026-06-08', '2026-06-10', '2026-06-12'], 4, 15, 10.5],
  [['2026-06-15', '2026-06-17', '2026-06-19'], 5, 12, 10.5],
  [['2026-06-22', '2026-06-24', '2026-06-26'], 5, 15, 10.5],
  [['2026-06-29', '2026-07-01', '2026-07-03'], 4, 6, 15.5],
  [['2026-07-06', '2026-07-08', '2026-07-10'], 4, 7, 15.5],
  [['2026-07-13', '2026-07-15', '2026-07-17'], 4, 8, 15.5],
  [['2026-07-20', '2026-07-22', '2026-07-24'], 4, 9, 15.5],
  [['2026-07-27', '2026-07-29', '2026-07-31'], 4, 10, 15.5],
  [['2026-08-03', '2026-08-05', '2026-08-07'], 4, 11, 15.5],
  [['2026-08-10', '2026-08-12', '2026-08-14'], 4, 12, 15.5],
  [['2026-08-17', '2026-08-19', '2026-08-21'], 4, 13, 15.5],
  [['2026-08-24', '2026-08-26', '2026-08-28'], 4, 14, 15.5],
  [['2026-08-31', '2026-09-02', '2026-09-04'], 4, 15, 15.5],
  [['2026-09-07', '2026-09-09', '2026-09-11'], 5, 12, 15.5],
  [['2026-09-14', '2026-09-16', '2026-09-18'], 5, 13, 15.5],
  [['2026-09-21', '2026-09-23', '2026-09-25'], 5, 14, 15.5],
  [['2026-09-28', '2026-09-30', '2026-10-02'], 5, 15, 15.5],
  [['2026-10-05', '2026-10-07', '2026-10-09'], 6, 12, 15.5],
  [['2026-10-12', '2026-10-14', '2026-10-16'], 6, 15, 15.5],
];

// remo: [fechas..., seriesRemo, repsRemo, pesoRemo, seriesThr, repsThr, pesoThr] por semana (2 sesiones)
const REMO_PLAN: [string[], number, number, number, number | null, number | null, number | null][] = [
  [['2026-02-06'], 3, 10, 5.5, 3, 10, 5.5],
  [['2026-02-11', '2026-02-13'], 3, 11, 5.5, 3, 11, 5.5],
  [['2026-02-18', '2026-02-20'], 3, 12, 5.5, 3, 12, 5.5],
  [['2026-02-25', '2026-02-27'], 4, 10, 5.5, 4, 10, 5.5],
  [['2026-03-03', '2026-03-05'], 4, 11, 5.5, 4, 11, 5.5],
  [['2026-03-10', '2026-03-12'], 4, 12, 5.5, 4, 12, 5.5],
  [['2026-03-17', '2026-03-19'], 4, 13, 5.5, 4, 13, 5.5],
  [['2026-03-24', '2026-03-26'], 4, 14, 5.5, 4, 14, 5.5],
  [['2026-03-31', '2026-04-02'], 4, 15, 5.5, 4, 15, 5.5],
  [['2026-04-07', '2026-04-09'], 4, 15, 5.5, 4, 6, 10.5],
  [['2026-04-14', '2026-04-16'], 4, 12, 10.5, 4, 7, 10.5],
  [['2026-04-21', '2026-04-23'], 4, 13, 10.5, 4, 8, 10.5],
  [['2026-04-28', '2026-04-30'], 4, 14, 10.5, 4, 9, 10.5],
  [['2026-05-05', '2026-05-07'], 4, 15, 10.5, 4, 10, 10.5],
  [['2026-05-12', '2026-05-14'], 4, 15, 10.5, 4, 11, 10.5],
  [['2026-05-19', '2026-05-21'], 4, 15, 10.5, 4, 12, 10.5],
  [['2026-05-26', '2026-05-28'], 4, 15, 10.5, 4, 12, 10.5],
  [['2026-06-02', '2026-06-04'], 4, 15, 10.5, 4, 13, 10.5],
  [['2026-06-09', '2026-06-11'], 4, 15, 10.5, 4, 13, 10.5],
  [['2026-06-16', '2026-06-18'], 5, 12, 10.5, 5, 10, 10.5],
  [['2026-06-23', '2026-06-25'], 5, 15, 10.5, 5, 12, 10.5],
  [['2026-06-30', '2026-07-02'], 4, 10, 10.5, 4, 10, 10.5],
  [['2026-07-07', '2026-07-09'], 4, 11, 10.5, null, null, null],
  [['2026-07-14', '2026-07-16'], 4, 12, 10.5, null, null, null],
  [['2026-07-21', '2026-07-23'], 4, 13, 10.5, null, null, null],
  [['2026-07-28', '2026-07-30'], 4, 14, 10.5, null, null, null],
  [['2026-08-04', '2026-08-06'], 4, 15, 10.5, null, null, null],
  [['2026-08-11', '2026-08-13'], 4, 15, 10.5, null, null, null],
  [['2026-08-18', '2026-08-20'], 4, 15, 10.5, null, null, null],
  [['2026-08-25', '2026-08-27'], 4, 15, 10.5, null, null, null],
  [['2026-09-01', '2026-09-03'], 4, 15, 10.5, null, null, null],
  [['2026-09-08', '2026-09-10'], 5, 12, 10.5, null, null, null],
  [['2026-09-15', '2026-09-17'], 5, 13, 10.5, null, null, null],
  [['2026-09-22', '2026-09-24'], 5, 14, 10.5, null, null, null],
  [['2026-09-29', '2026-10-01'], 5, 15, 10.5, null, null, null],
  [['2026-10-06', '2026-10-08'], 6, 12, 10.5, null, null, null],
  [['2026-10-13', '2026-10-15'], 6, 15, 10.5, null, null, null],
];

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function labelFecha(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${d} ${MESES[Number(m) - 1]}`;
}

/** Convierte el plan de fechas del PySide en opciones de programa. */
function opcionesDesdePlan(
  plan: [string[], number, number, number][],
  extra?: (series: number, reps: number, peso: number) => Partial<ProgramaConfig> & { ejercicios?: Ejercicio[] }
): ProgramaOpcion[] {
  const out: ProgramaOpcion[] = [];
  for (const [fechas, series, reps, peso] of plan) {
    for (const fecha of fechas) {
      const ejercicios: Ejercicio[] = extra?.(series, reps, peso)?.ejercicios ?? [
        { name: 'Thruster', note: `${peso} kg`, type: 'reps' },
      ];
      out.push({
        key: fecha,
        label: labelFecha(fecha),
        fecha,
        config: {
          modo: 'fases',
          series,
          reps,
          restSegundos: 60,
          banner: `SESIÓN DEL ${labelFecha(fecha).toUpperCase()}`,
          fases: FASES_REP,
          pesoKg: peso,
          ultimaSerieInfinita: true,
          ...extra?.(series, reps, peso),
        },
        ejercicios,
      });
    }
  }
  return out.sort((a, b) => (a.fecha! < b.fecha! ? -1 : 1));
}

// ── Definición de las 5 modalidades ───────────────────────────────────────

const pausasEjercicios: Ejercicio[] = [
  { name: 'Flexión de Cuello y Columna Sentado', note: 'En silla', cue: 'Dejá caer la cabeza lentamente. Sentí cada vértebra. Respirá profundo en la posición final.', url: 'https://youtube.com/shorts/lBm6oUekF3k', type: 'reps' },
  { name: 'Rotación de Tronco Sentado', note: 'En silla · por lado', cue: 'Rotá desde la cadera, no solo los hombros. Mantené los pies apoyados en el suelo.', url: 'https://youtube.com/shorts/WbYwRcR6sHc', type: 'reps' },
  { name: 'Extensión Lumbar en Silla', note: 'En silla · manos en nuca', cue: 'Extendé la columna sobre el respaldo. Abrí el pecho. Respirá en extensión, exhalá al volver.', url: 'https://drive.google.com/file/d/1e2kXPpSIneV42tkC7zcfjxaKfqCrbZXe/view?usp=drive_link', type: 'reps' },
  { name: 'Elevación de Rodillas Sentado', note: 'En silla · alternado', cue: 'Activá el core al elevar cada rodilla. Movimiento controlado. Espalda recta contra el respaldo.', url: 'https://drive.google.com/file/d/1yUSHYe3JyDYBAEM4BFWmvK6iFfM8DgJT/view?usp=drive_link', type: 'reps' },
];

export const MODALIDADES: ModalidadDef[] = [
  {
    id: 'pausas',
    nombre: 'Pausas Activas',
    subtitulo: 'Movilidad de escritorio · 11 hs y 16 hs',
    icono: '☀️',
    acento: '#fb923c',
    programas: [
      {
        key: 'slot',
        label: 'Horario de la pausa',
        opciones: [
          {
            key: '11', label: '11 hs', emoji: '☀️',
            config: {
              modo: 'circuito', series: 2, restSegundos: 30, reps: 8,
              banner: 'PAUSA DE LAS 11 HS · EN EL ESCRITORIO',
              bannerNote: 'Controlá el movimiento. Despacio. Sentí cada parte del cuerpo que vas movilizando.',
              doneMsg: 'Bien. Seguí con energía. Ya falta poco para el almuerzo.',
            },
            ejercicios: pausasEjercicios,
          },
          {
            key: '16', label: '16 hs', emoji: '🌇',
            config: {
              modo: 'circuito', series: 2, restSegundos: 30, reps: 8,
              banner: 'PAUSA DE LAS 16 HS · EN EL ESCRITORIO',
              bannerNote: 'Controlá el movimiento. Despacio. Sentí cada parte del cuerpo que vas movilizando.',
              doneMsg: 'Perfecto. Terminás el día con el cuerpo suelto.',
            },
            ejercicios: pausasEjercicios,
          },
        ],
      },
    ],
  },
  {
    id: 'movilidad',
    nombre: 'Movilidad',
    subtitulo: 'Inicio y fin de día · Columna · Cadera',
    icono: '🧘',
    acento: '#8ab4f8',
    programas: [
      {
        key: 'momento',
        label: 'Momento del día',
        opciones: [
          {
            key: 'night', label: 'Noche', emoji: '🌙',
            config: {
              modo: 'circuito', series: 2, restSegundos: 30, reps: 6,
              banner: 'ANTES DE IRTE A DORMIR · EN LA CAMA',
              bannerNote: 'Controlá el movimiento. Despacio. Sentí vértebra a vértebra. No hay apuro.',
              doneMsg: 'Tu cuerpo lo va a agradecer. Buenas noches.',
            },
            ejercicios: [
              { name: 'Gato Bueno / Gato Malo', note: 'En cuadrupedia', cue: 'Inspirá en la flexión (gato bueno), exhalá en la extensión (gato malo). Sentí cada vértebra.', url: 'https://youtube.com/shorts/wqW9xj_Zqso', type: 'reps' },
              { name: 'Rodilla al Pecho con Pierna Cruzada', note: 'Acostado · por lado', cue: 'Mantené la espalda en contacto con la cama. Respirá profundo mientras llevás la rodilla al pecho.', url: 'https://youtube.com/shorts/msztsdZTnjw', type: 'reps' },
              { name: 'Movilidad Lumbar Acostada', note: 'Acostado en la cama', cue: 'Movimiento lento y controlado. Sentí la zona lumbar apoyarse y despegarse.', url: 'https://drive.google.com/file/d/1n90nnQk1g5RnNlyqXpAVDY-yM-TQqH8m/view?usp=sharing', type: 'reps' },
              { name: 'Rotaciones Torácicas en Cuadrupedia', note: 'En cuadrupedia · por lado', cue: 'Rotá desde la columna torácica, no desde el hombro. Seguí tu codo con la mirada.', url: 'https://youtube.com/shorts/v55my0wsSqo', type: 'reps' },
              { name: 'Ranitas a 1 Pierna', note: 'Por lado', cue: 'Abrí la cadera gradualmente sin forzar. Respirá relajando en cada repetición.', url: 'https://youtube.com/shorts/W91ZA42rxhs', type: 'reps' },
            ],
          },
          {
            key: 'morning', label: 'Mañana', emoji: '🌅',
            config: {
              modo: 'circuito', series: 2, restSegundos: 30, reps: 6,
              banner: 'ACTIVACIÓN DE LA MAÑANA · ANTES DE EMPEZAR EL DÍA',
              bannerNote: 'Activá el cuerpo de forma progresiva. Respiración profunda. Sin apuro.',
              doneMsg: 'Arrancás el día con el cuerpo activado. ¡A trabajar!',
            },
            ejercicios: [
              { name: 'Gato Bueno / Gato Malo', note: 'En cuadrupedia', cue: 'Despertá la columna. Movimiento lento y progresivo para activar la movilidad de la mañana.', url: 'https://youtube.com/shorts/wqW9xj_Zqso', type: 'reps' },
              { name: 'Rotaciones Torácicas en Cuadrupedia', note: 'En cuadrupedia · por lado', cue: 'Activá la columna torácica. Seguí el movimiento con la mirada.', url: 'https://youtube.com/shorts/v55my0wsSqo', type: 'reps' },
              { name: 'Rodilla al Pecho con Pierna Cruzada', note: 'Acostado · por lado', cue: 'Soltá la tensión acumulada durante el sueño. Respiración profunda en cada rep.', url: 'https://youtube.com/shorts/msztsdZTnjw', type: 'reps' },
              { name: 'Movilidad Lumbar Acostada', note: 'Acostado', cue: 'Activá la zona lumbar antes de pararte. Movimiento controlado vértebra a vértebra.', url: 'https://drive.google.com/file/d/1n90nnQk1g5RnNlyqXpAVDY-yM-TQqH8m/view?usp=sharing', type: 'reps' },
              { name: 'Ranitas a 1 Pierna', note: 'Por lado', cue: 'Abrí la cadera para preparar el cuerpo para el movimiento del día.', url: 'https://youtube.com/shorts/W91ZA42rxhs', type: 'reps' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'entrenamiento',
    nombre: 'Entrenamiento',
    subtitulo: 'Fuerza · Resistencia · 5 semanas · 5 días',
    icono: '🏋️',
    acento: '#b8ff00',
    gifBase: 'entrenamiento/',
    programas: [
      {
        key: 'dia',
        label: 'Día de entrenamiento',
        opciones: [
          {
            key: 'd1', label: 'DÍA 1',
            config: {
              modo: 'circuito', series: 3, restSegundos: 30,
              banner: 'DÍA 1 · PLAN DE ENTRENAMIENTO',
              bannerNote: 'Controlá la técnica. Si bajás la carga, mantené el rango completo.',
              doneMsg: '¡Excelente trabajo! Descansá y volvé mañana con energía.',
              semanas: [
                { label: 'S1', stars: '⭐', series: 3, values: [6, 8, 8] },
                { label: 'S2', stars: '⭐⭐', series: 4, values: [6, 8, 8] },
                { label: 'S3', stars: '⭐⭐⭐', series: 3, values: [8, 10, 10] },
                { label: 'S4', stars: '⭐⭐⭐⭐', series: 4, values: [8, 10, 10] },
                { label: 'S5', stars: '⭐⭐⭐⭐⭐', series: 3, values: [10, 12, 12] },
              ],
            },
            ejercicios: [
              { name: 'Bolitas Abdominales', gif: '1bolitas.gif', type: 'reps' },
              { name: 'Press de Hombros', gif: '1press.gif', note: '5 kg', type: 'reps' },
              { name: 'Jumping Jacks', gif: '1jumping.gif', type: 'reps' },
            ],
          },
          {
            key: 'd2', label: 'DÍA 2',
            config: {
              modo: 'circuito', series: 3, restSegundos: 30,
              banner: 'DÍA 2 · PLAN DE ENTRENAMIENTO',
              bannerNote: 'Controlá la técnica. Si bajás la carga, mantené el rango completo.',
              doneMsg: '¡Excelente trabajo! Descansá y volvé mañana con energía.',
              semanas: [
                { label: 'S1', stars: '⭐', series: 3, values: [15, 8, 12] },
                { label: 'S2', stars: '⭐⭐', series: 4, values: [15, 8, 12] },
                { label: 'S3', stars: '⭐⭐⭐', series: 3, values: [20, 10, 15] },
                { label: 'S4', stars: '⭐⭐⭐⭐', series: 4, values: [20, 10, 15] },
                { label: 'S5', stars: '⭐⭐⭐⭐⭐', series: 3, values: [25, 12, 18] },
              ],
            },
            ejercicios: [
              { name: 'Cuadrupedia Despegando Rodillas', gif: '2cuadrupedia.gif', type: 'time' },
              { name: 'Sentadilla con Mancuerna', gif: '2sentadilla.gif', note: '10 kg', type: 'reps' },
              { name: 'Mountain Climbers', gif: '2climbers.gif', type: 'reps' },
            ],
          },
          {
            key: 'd3', label: 'DÍA 3',
            config: {
              modo: 'circuito', series: 3, restSegundos: 30,
              banner: 'DÍA 3 · PLAN DE ENTRENAMIENTO',
              bannerNote: 'Controlá la técnica. Si bajás la carga, mantené el rango completo.',
              doneMsg: '¡Excelente trabajo! Descansá y volvé mañana con energía.',
              semanas: [
                { label: 'S1', stars: '⭐', series: 3, values: [8, 6, 12] },
                { label: 'S2', stars: '⭐⭐', series: 4, values: [8, 6, 12] },
                { label: 'S3', stars: '⭐⭐⭐', series: 3, values: [10, 8, 16] },
                { label: 'S4', stars: '⭐⭐⭐⭐', series: 4, values: [10, 8, 16] },
                { label: 'S5', stars: '⭐⭐⭐⭐⭐', series: 3, values: [12, 10, 20] },
              ],
            },
            ejercicios: [
              { name: 'Bicho Muerto', gif: '3bicho.gif', type: 'reps' },
              { name: 'Remos en Plancha sobre Silla', gif: '3remos.gif', note: '5 kg · por lado', type: 'reps' },
              { name: 'Subo y Bajo Escalón', gif: '3repiques.gif', type: 'reps' },
            ],
          },
          {
            key: 'd4', label: 'DÍA 4',
            config: {
              modo: 'circuito', series: 3, restSegundos: 30,
              banner: 'DÍA 4 · PLAN DE ENTRENAMIENTO',
              bannerNote: 'Controlá la técnica. Si bajás la carga, mantené el rango completo.',
              doneMsg: '¡Excelente trabajo! Descansá y volvé mañana con energía.',
              semanas: [
                { label: 'S1', stars: '⭐', series: 3, values: [8, 8, 6] },
                { label: 'S2', stars: '⭐⭐', series: 4, values: [8, 8, 6] },
                { label: 'S3', stars: '⭐⭐⭐', series: 3, values: [10, 10, 8] },
                { label: 'S4', stars: '⭐⭐⭐⭐', series: 4, values: [10, 10, 8] },
                { label: 'S5', stars: '⭐⭐⭐⭐⭐', series: 3, values: [12, 12, 10] },
              ],
            },
            ejercicios: [
              { name: 'Bird Dog', gif: '4bird.gif', type: 'reps' },
              { name: 'Buenos Días con Mancuerna', gif: '4buenosdias.gif', type: 'reps' },
              { name: 'Sprowl con Silla', gif: '4sprwol.gif', type: 'reps' },
            ],
          },
          {
            key: 'd5', label: 'DÍA 5',
            config: {
              modo: 'circuito', series: 3, restSegundos: 30,
              banner: 'DÍA 5 · PLAN DE ENTRENAMIENTO',
              bannerNote: 'Controlá la técnica. Si bajás la carga, mantené el rango completo.',
              doneMsg: '¡Excelente trabajo! Descansá y volvé mañana con energía.',
              semanas: [
                { label: 'S1', stars: '⭐', series: 3, values: [8, 6, 12] },
                { label: 'S2', stars: '⭐⭐', series: 4, values: [8, 6, 12] },
                { label: 'S3', stars: '⭐⭐⭐', series: 3, values: [10, 8, 16] },
                { label: 'S4', stars: '⭐⭐⭐⭐', series: 4, values: [10, 8, 16] },
                { label: 'S5', stars: '⭐⭐⭐⭐⭐', series: 3, values: [12, 10, 20] },
              ],
            },
            ejercicios: [
              { name: 'Hollow', gif: '5hollow.gif', type: 'time' },
              { name: 'Flexiones en Plano Inclinado / Pared', gif: '5flrexiones.gif', type: 'reps' },
              { name: 'Rodillas Arriba en el Lugar', gif: '5rodillas.gif', type: 'reps' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'remo',
    nombre: 'Remo',
    subtitulo: 'Remo a dos mancuernas · Mar y Jue',
    icono: '🚣',
    acento: '#ff6b35',
    programas: [
      {
        key: 'fecha',
        label: 'Sesión (auto según la fecha)',
        opciones: opcionesDesdePlan(REMO_PLAN, (series, reps, peso) => ({
          ejercicios: [{ name: 'Remo a Dos Mancuernas', note: `${peso} kg`, type: 'reps' }],
        })),
      },
    ],
  },
  {
    id: 'thruster',
    nombre: 'Thruster',
    subtitulo: 'Thruster con mancuernas · Lun, Mié y Vie',
    icono: '⚡',
    acento: '#facc15',
    programas: [
      {
        key: 'fecha',
        label: 'Sesión (auto según la fecha)',
        opciones: opcionesDesdePlan(THRUSTER_PLAN),
      },
    ],
  },
];

export const MODALIDAD_POR_ID = Object.fromEntries(MODALIDADES.map((m) => [m.id, m])) as Record<ModalidadId, ModalidadDef>;
