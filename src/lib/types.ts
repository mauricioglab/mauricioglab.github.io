export type UserRole = 'visitante' | 'alumno' | 'profesor' | 'tutor' | 'profesor_practica' | 'director' | 'admin'

export interface Grupo {
  id: number
  proyecto: string
  comision: string
  practica?: string
  carrera_id: string
  practica_origen?: string | null
  alertas?: string[]
  activo?: boolean
}

export interface Integrante {
  id: string
  grupo_id: number
  nombre: string
  rol: string
  observacion: string
  tags?: string[]
}

export interface Carrera {
  id: string
  nombre: string
  activa: boolean
}

export interface PracticaCatalogo {
  id: string
  carrera_id: string
  codigo: string
  nombre: string
  orden: number
  activa: boolean
}

export interface PlanillaEncuentro {
  id: number
  carrera_id: string
  practica: string
  encuentro: string
  nombre: string
  pregunta: string
  criterio_fn: string
  criterio_dev: string
  criterio_sm: string
}

export interface EncuentroMeta {
  id: string
  nombre: string
  pregunta: string
}

export interface Criterio {
  id: string
  encuentro_meta_id: string
  dimension: string
  descripcion: string
}

export interface Evaluacion {
  id: string
  grupo_id: number
  encuentro_meta_id: string
  fn: number | null
  dev: number | null
  sm: number | null
  feedback_fn: string
  feedback_dev: string
  feedback_sm: string
  fecha_primera_nota?: string | null
  fecha_modificacion?: string | null
  es_modificacion?: boolean
  override_limite?: boolean
}

export interface AsistenciaRegistro {
  id: string
  evaluacion_id: string
  integrante_nombre: string
  estado: string
}

export interface Profile {
  id: string
  role: UserRole
  nombre: string
}

export type PPEstado = 'no_cursada' | 'cursada_no_reg' | 'regularizada' | 'aprobada' | 'debe_recursar'
export type AlumnoSeguimientoEstado = 'pendiente_revision' | 'habilitado' | 'condicional' | 'a_recurrir'

export interface MateriaPendiente {
  nombre: string
  regularizada_en: string
}

export interface MateriaACursar {
  nombre: string
}

export interface MiembroAnterior {
  nombre: string
  contacto: string
}

export interface AlumnoSeguimiento {
  id: string
  nombre_completo: string
  dni: string
  email: string
  telefono: string
  usuario_teams: string
  comision: string
  pp1_estado: PPEstado
  pp1_mes_regularizada: string
  pp2_estado: PPEstado
  pp2_mes_regularizada: string
  pp3_estado: PPEstado
  pp3_mes_regularizada: string
  tiene_proyecto: boolean
  proyecto_nombre: string
  proyecto_tutor: string
  buscando_proyecto: boolean
  tiene_grupo: boolean
  grupo_detalle: string
  grupo_miembros_anteriores: MiembroAnterior[]
  buscando_grupo: boolean
  materias_a_cursar: MateriaACursar[]
  materias_pendientes: MateriaPendiente[]
  estado: AlumnoSeguimientoEstado
  puede_aspirar: boolean | null
  motivo_inhabilitacion: string
  observaciones_admin: string
  creado_en: any
  actualizado_en: any
}