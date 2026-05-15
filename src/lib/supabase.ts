import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || 'https://rnejgcdfpbkqbdoadeib.supabase.co'
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_wQef0RztvyMcq52QckV7Uw_BcXEdBqI'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type UserRole = 'visitante' | 'alumno' | 'profesor' | 'tutor' | 'profesor_practica' | 'director' | 'admin'

export interface Grupo {
  id: number
  proyecto: string
  comision: string
}

export interface Integrante {
  id: number
  grupo_id: number
  nombre: string
  rol: string
  observacion: string
}

export interface EncuentroMeta {
  id: string
  nombre: string
  pregunta: string
}

export interface Criterio {
  id: number
  encuentro_meta_id: string
  dimension: string
  descripcion: string
}

export interface Evaluacion {
  id: number
  grupo_id: number
  encuentro_meta_id: string
  fn: number | null
  dev: number | null
  sm: number | null
  feedback_fn: string
  feedback_dev: string
  feedback_sm: string
}

export interface AsistenciaRegistro {
  id: number
  evaluacion_id: number
  integrante_nombre: string
  estado: string
}

export interface Profile {
  id: string
  user_id: string
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
  creado_en: string
  actualizado_en: string
}
