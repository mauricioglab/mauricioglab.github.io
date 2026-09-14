import { supabase } from '../lib/supabase';
import { MODALIDADES, MODALIDAD_POR_ID, type ModalidadDef, type ModalidadId, type ProgramaOpcion } from '../data/movimiento';

/**
 * Movimiento - capa de datos. Consulta `movimiento_programas` (PocketBase) en
 * build time (patrón recursos: catch silencioso) y aplica las filas como
 * overrides de las opciones embebidas en `src/data/movimiento.ts`.
 *
 * Esquema real en PocketBase: modalidad, nombre y `data` (json) que contiene
 * { selector, orden, draft, config, ejercicios }.
 */

interface MovimientoProgramaRow {
  id: string;
  modalidad: ModalidadId;
  nombre: string;
  data: {
    selector?: string;
    orden?: number;
    draft?: boolean;
    config?: ProgramaOpcion['config'];
    ejercicios?: ProgramaOpcion['ejercicios'];
  } | null;
}

function clonarModalidades(): ModalidadDef[] {
  return JSON.parse(JSON.stringify(MODALIDADES));
}

export async function getModalidades(): Promise<ModalidadDef[]> {
  const modalidades = clonarModalidades();

  try {
    const { data, error } = await supabase
      .from('movimiento_programas')
      .select('id, modalidad, nombre, data');

    if (error) {
      console.warn('No se pudieron cargar los programas de movimiento de PocketBase:', error.message ?? error);
      return modalidades;
    }

    // PocketBase no tiene el campo `orden` como columna: se ordena en cliente
    const rows = ((data ?? []) as MovimientoProgramaRow[])
      .slice()
      .sort((a, b) => (a.data?.orden ?? 0) - (b.data?.orden ?? 0));

    for (const row of rows) {
      const modalidad = MODALIDAD_POR_ID[row.modalidad];
      const payload = row.data ?? {};
      if (!modalidad || !payload.config) continue;
      const selector = payload.selector ?? '';

      const programa = modalidad.programas.find((p) => p.opciones.some((o) => o.key === selector))
        ?? modalidad.programas[0];
      if (!programa) continue;

      const opcion: ProgramaOpcion = {
        key: selector,
        label: row.nombre || selector,
        config: payload.config,
        ejercicios: Array.isArray(payload.ejercicios) ? payload.ejercicios : [],
      };

      const idx = programa.opciones.findIndex((o) => o.key === selector);
      if (idx >= 0) programa.opciones[idx] = opcion;
      else programa.opciones.push(opcion);
    }
  } catch (e) {
    console.warn('No se pudieron cargar los programas de movimiento de PocketBase:', e);
  }

  return modalidades;
}
