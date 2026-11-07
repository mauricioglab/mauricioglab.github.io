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
