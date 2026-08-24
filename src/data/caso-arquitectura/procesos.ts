import type { Proceso } from './types';
import data from './json/procesos.json';
// `satisfies` no aplica aquí: TS infiere los strings de un JSON importado como
// `string` genérico, no como literal, así que no puede validar la unión
// discriminada de FlowStep (kind: 'node' | 'decision') contra el JSON.
export default data as Proceso[];
