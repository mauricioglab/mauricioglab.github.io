import { supabase } from '../lib/supabase';
import { MODALIDADES, MODALIDAD_POR_ID, type ModalidadDef, type ModalidadId, type ProgramaOpcion } from '../data/movimiento';

/**
 * Movimiento - capa de datos. Consulta `movimiento_programas` en build time
 * (patrón recursos: catch silencioso) y aplica las filas de la DB como
 * overrides de las opciones embebidas en `src/data/movimiento.ts`.
 */

interface MovimientoProgramaRow {
  modalidad: ModalidadId;
  selector: string;
  nombre: string;
  orden: number;
  config: ProgramaOpcion['config'];
  ejercicios: ProgramaOpcion['ejercicios'];
}

function clonarModalidades(): ModalidadDef[] {
  return JSON.parse(JSON.stringify(MODALIDADES));
}

export async function getModalidades(): Promise<ModalidadDef[]> {
  const modalidades = clonarModalidades();

  try {
    const { data, error } = await supabase
      .from('movimiento_programas')
      .select('modalidad, selector, nombre, orden, config, ejercicios')
      .eq('draft', false)
      .order('orden', { ascending: true });

    if (error) {
      console.warn('No se pudieron cargar los programas de movimiento de Supabase:', error.message);
      return modalidades;
    }

    for (const row of (data ?? []) as MovimientoProgramaRow[]) {
      const modalidad = MODALIDAD_POR_ID[row.modalidad];
      if (!modalidad || !row.config) continue;

      const programa = modalidad.programas.find((p) => p.opciones.some((o) => o.key === row.selector))
        ?? modalidad.programas[0];
      if (!programa) continue;

      const opcion: ProgramaOpcion = {
        key: row.selector,
        label: row.nombre || row.selector,
        config: row.config,
        ejercicios: Array.isArray(row.ejercicios) ? row.ejercicios : [],
      };

      const idx = programa.opciones.findIndex((o) => o.key === row.selector);
      if (idx >= 0) programa.opciones[idx] = opcion;
      else programa.opciones.push(opcion);
    }
  } catch (e) {
    console.warn('No se pudieron cargar los programas de movimiento de Supabase:', e);
  }

  return modalidades;
}
