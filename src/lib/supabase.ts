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
