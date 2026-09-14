import { useEffect, useState } from 'preact/hooks';
import { db } from '../../lib/db';
import { MODALIDADES } from '../../data/movimiento';

const MODALIDAD_IDS = MODALIDADES.map((m) => m.id);
const FALLBACK: Record<string, any[]> = Object.fromEntries(MODALIDADES.map((m) => [m.id, m.programas[0].opciones]));

interface Programa {
  id: string;
  modalidad: string;
  nombre: string;
  selector: string;
  orden: number;
  draft: boolean;
  config: any;
  ejercicios: any[];
}

interface Sesion {
  id: string;
  fecha: string;
  modalidad: string;
  programa_nombre: string;
  nota: string;
  usuario_email?: string;
  user_id?: string;
}

interface FormState {
  modalidad: string;
  selector: string;
  nombre: string;
  orden: number;
  draft: boolean;
  configText: string;
  ejerciciosText: string;
}

const emptyForm: FormState = {
  modalidad: 'pausas',
  selector: '',
  nombre: '',
  orden: 0,
  draft: false,
  configText: '{}',
  ejerciciosText: '[]',
};

export default function MovimientoAdminPreact() {
  const [busy, setBusy] = useState(false);
  const [vista, setVista] = useState<'programas' | 'sesiones'>('programas');
  const [filtro, setFiltro] = useState('');
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [form, setForm] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState('');
  const [errorConfig, setErrorConfig] = useState(false);
  const [errorEjercicios, setErrorEjercicios] = useState(false);
  const [f, setF] = useState<FormState>(emptyForm);

  async function loadProgramas() {
    const { data, error } = await db.from('movimiento_programas').select('id, modalidad, nombre, data');
    if (!error) {
      setProgramas(
        (data || []).map((r: any) => ({
          id: r.id,
          modalidad: r.modalidad,
          nombre: r.nombre || '',
          selector: r.data?.selector ?? '',
          orden: r.data?.orden ?? 0,
          draft: !!r.data?.draft,
          config: r.data?.config ?? {},
          ejercicios: r.data?.ejercicios ?? [],
        }))
      );
    }
  }

  async function loadSesiones() {
    const { data, error } = await db.from('movimiento_historial').select('*').order('fecha', { ascending: false }).limit(50);
    if (!error) setSesiones(data || []);
  }

  useEffect(() => {
    loadProgramas();
  }, []);

  const programasFiltrados = filtro ? programas.filter((r) => r.modalidad === filtro) : programas;

  function nuevo() {
    setEditando(null);
    setMensaje('');
    const ordenMax = Math.max(0, ...programas.filter((r) => r.modalidad === filtro).map((r) => r.orden || 0));
    setF({
      modalidad: filtro || 'pausas',
      selector: '',
      nombre: '',
      orden: ordenMax + 1,
      draft: false,
      configText: '{\n  "modo": "circuito",\n  "series": 2,\n  "restSegundos": 30,\n  "reps": 8,\n  "banner": ""}',
      ejerciciosText: '[]',
    });
    setForm(true);
  }

  function editar(r: Programa) {
    setEditando(r.id);
    setMensaje('');
    setF({
      modalidad: r.modalidad,
      selector: r.selector,
      nombre: r.nombre,
      orden: r.orden || 0,
      draft: !!r.draft,
      configText: JSON.stringify(r.config ?? {}, null, 2),
      ejerciciosText: JSON.stringify(r.ejercicios ?? [], null, 2),
    });
    setForm(true);
  }

  function validarJson(current: FormState) {
    let okConfig = true;
    let okEjercicios = true;
    try {
      current.configText ? JSON.parse(current.configText) : {};
    } catch {
      okConfig = false;
    }
    try {
      JSON.parse(current.ejerciciosText || '[]');
    } catch {
      okEjercicios = false;
    }
    setErrorConfig(!okConfig);
    setErrorEjercicios(!okEjercicios);
    return okConfig && okEjercicios;
  }

  async function guardar() {
    if (!f.selector.trim()) {
      setMensaje('El selector es obligatorio.');
      return;
    }
    if (!validarJson(f)) return;
    setBusy(true);
    setMensaje('');
    try {
      const payload = {
        modalidad: f.modalidad,
        nombre: f.nombre.trim(),
        data: {
          selector: f.selector.trim(),
          orden: f.orden || 0,
          draft: f.draft,
          config: JSON.parse(f.configText || '{}'),
          ejercicios: JSON.parse(f.ejerciciosText || '[]'),
        },
      };
      const existente = programas.find((r) => r.id === editando);
      const { error } = existente ? await db.from('movimiento_programas').update(payload).eq('id', existente.id) : await db.from('movimiento_programas').insert(payload);
      if (error) throw error;
      setMensaje('Guardado ✓ (se publica en el próximo build)');
      await loadProgramas();
    } catch (e: any) {
      setMensaje('Error: ' + (e.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  async function borrar() {
    if (!window.confirm('¿Eliminar este programa?')) return;
    setBusy(true);
    try {
      const { error } = await db.from('movimiento_programas').delete().eq('id', editando);
      if (error) throw error;
      setForm(false);
      setEditando(null);
      await loadProgramas();
    } catch (e: any) {
      setMensaje('Error: ' + (e.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  async function seedModalidad() {
    const opciones = FALLBACK[filtro];
    if (!opciones) return;
    if (!window.confirm(`¿Sembrar ${opciones.length} programas de ${filtro} en la DB? (sobrescribe los existentes de esa modalidad)`)) return;
    setBusy(true);
    try {
      const existentes = new Map(programas.filter((r) => r.modalidad === filtro).map((r) => [r.selector, r.id]));
      let guardados = 0;
      for (let i = 0; i < opciones.length; i++) {
        const op = opciones[i];
        const payload = {
          modalidad: filtro,
          nombre: op.label,
          data: { selector: op.key, orden: i, draft: false, config: op.config, ejercicios: op.ejercicios },
        };
        const id = existentes.get(op.key);
        const { error } = id ? await db.from('movimiento_programas').update(payload).eq('id', id) : await db.from('movimiento_programas').insert(payload);
        if (error) throw error;
        guardados++;
      }
      setMensaje(`${guardados} programas sembrados ✓`);
      await loadProgramas();
    } catch (e: any) {
      setMensaje('Error: ' + (e.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div class="max-w-7xl mx-auto p-4 md:p-6">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold">🤸 Movimiento</h1>
      </div>

      <div class="flex gap-1 border-b border-slate-700 mb-6">
        <button
          class={'px-4 py-2 text-sm font-bold border-b-2 -mb-px transition ' + (vista === 'programas' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200')}
          onClick={() => {
            setVista('programas');
            loadProgramas();
          }}
        >
          Programas
        </button>
        <button
          class={'px-4 py-2 text-sm font-bold border-b-2 -mb-px transition ' + (vista === 'sesiones' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200')}
          onClick={() => {
            setVista('sesiones');
            loadSesiones();
          }}
        >
          Sesiones
        </button>
      </div>

      {vista === 'programas' && (
        <div class="flex flex-col gap-6">
          <div class="flex flex-wrap items-center gap-2">
            <select
              class="px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
              value={filtro}
              onChange={(e) => setFiltro((e.target as HTMLSelectElement).value)}
            >
              <option value="">Todas las modalidades</option>
              {MODALIDAD_IDS.map((m) => (
                <option key={m} value={m}>
                  {m.toUpperCase()}
                </option>
              ))}
            </select>
            <button class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold rounded-lg" onClick={nuevo}>
              + Nuevo programa
            </button>
            <button class="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-60 text-white text-sm font-bold rounded-lg" onClick={seedModalidad} disabled={!filtro}>
              {'Sembrar ' + (filtro || '').toUpperCase()}
            </button>
          </div>

          {form && (
            <div class="bg-slate-800 rounded-xl p-5 space-y-4">
              <h2 class="text-base font-bold">Identificación</h2>
              <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label class="block text-xs font-bold text-slate-300 mb-1">Modalidad</label>
                  <select
                    class="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    value={f.modalidad}
                    onChange={(e) => setF({ ...f, modalidad: (e.target as HTMLSelectElement).value })}
                  >
                    {MODALIDAD_IDS.map((m) => (
                      <option key={m} value={m}>
                        {m.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-300 mb-1">Selector (clave)</label>
                  <input
                    class="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    value={f.selector}
                    onInput={(e) => setF({ ...f, selector: (e.target as HTMLInputElement).value })}
                    placeholder="11 / night / d1 / 2026-09-14"
                  />
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-300 mb-1">Nombre</label>
                  <input
                    class="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    value={f.nombre}
                    onInput={(e) => setF({ ...f, nombre: (e.target as HTMLInputElement).value })}
                    placeholder="11 hs / Noche / DÍA 1"
                  />
                </div>
                <div class="flex gap-3">
                  <div class="w-20">
                    <label class="block text-xs font-bold text-slate-300 mb-1">Orden</label>
                    <input
                      class="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      type="number"
                      value={f.orden}
                      onInput={(e) => setF({ ...f, orden: Number((e.target as HTMLInputElement).value) || 0 })}
                    />
                  </div>
                  <label class="flex items-center gap-2 text-xs text-slate-300 mt-6 cursor-pointer">
                    <input type="checkbox" checked={f.draft} onChange={(e) => setF({ ...f, draft: (e.target as HTMLInputElement).checked })} /> Borrador
                  </label>
                </div>
              </div>

              <div class="border-t border-slate-700 pt-4 space-y-3">
                <h3 class="text-sm font-bold text-slate-200">Configuración avanzada (JSON)</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label class="block text-xs font-bold text-slate-300 mb-1">
                      Config {errorConfig && <span class="text-red-400">· JSON inválido</span>}
                    </label>
                    <textarea
                      class="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm font-mono min-h-[140px] focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      value={f.configText}
                      onInput={(e) => setF({ ...f, configText: (e.target as HTMLTextAreaElement).value })}
                      spellcheck={false}
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-slate-300 mb-1">
                      Ejercicios {errorEjercicios && <span class="text-red-400">· JSON inválido</span>}
                    </label>
                    <textarea
                      class="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm font-mono min-h-[140px] focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      value={f.ejerciciosText}
                      onInput={(e) => setF({ ...f, ejerciciosText: (e.target as HTMLTextAreaElement).value })}
                      spellcheck={false}
                    />
                  </div>
                </div>
              </div>

              {mensaje && <p class="text-xs text-slate-400">{mensaje}</p>}
              <div class="border-t border-slate-700 pt-4 flex gap-3">
                <button class="px-5 py-2 bg-green-700 hover:bg-green-800 disabled:opacity-60 text-sm font-bold rounded-lg" disabled={busy} onClick={guardar}>
                  {busy ? 'Guardando…' : 'Guardar'}
                </button>
                <button class="px-5 py-2 border border-slate-600 hover:border-slate-500 text-sm font-bold rounded-lg" onClick={() => setForm(false)}>
                  Cancelar
                </button>
                {editando && (
                  <button class="px-5 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-lg" onClick={borrar}>
                    Eliminar
                  </button>
                )}
              </div>
            </div>
          )}

          <div class="bg-slate-800 rounded-xl p-5">
            {!programas.length && <p class="text-sm text-slate-400">No hay programas en la DB. Usá "Sembrar" para precargar los datos locales de una modalidad.</p>}
            <div class="space-y-2">
              {programasFiltrados.map((r) => (
                <div key={r.modalidad + r.selector} class="bg-slate-900 border border-slate-700 rounded-lg p-3 flex items-center gap-3 text-sm">
                  <span class="rounded-md border border-slate-600 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-slate-400">{r.modalidad}</span>
                  <span class="font-bold">{r.nombre || r.selector}</span>
                  <span class="text-slate-400">{r.selector}</span>
                  {r.draft && <span class="rounded-md border border-amber-500/40 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-amber-400">Borrador</span>}
                  <span class="ml-auto">
                    <button class="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-xs font-bold rounded-lg" onClick={() => editar(r)}>
                      Editar
                    </button>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {vista === 'sesiones' && (
        <div class="bg-slate-800 rounded-xl p-5">
          {!sesiones.length && <p class="text-sm text-slate-400">Sin sesiones registradas todavía.</p>}
          <div class="space-y-2">
            {sesiones.map((s) => (
              <div key={s.id} class="bg-slate-900 border border-slate-700 rounded-lg p-3 flex items-center gap-3 text-sm">
                <span class="rounded-md border border-slate-600 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-slate-400">{s.fecha}</span>
                <span class="rounded-md border border-slate-600 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-slate-400">{s.modalidad}</span>
                <span class="font-bold">{s.programa_nombre}</span>
                <span class="text-slate-400">{s.nota}</span>
                <span class="ml-auto text-slate-500 text-xs">{(s.usuario_email || s.user_id || '').slice(0, 18)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
