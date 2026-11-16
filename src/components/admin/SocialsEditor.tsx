// Editor de redes sociales: agregar, quitar, ordenar y cambiar el enlace de cada red. Guarda en site_settings.data.networks.
// ARCHIVO IDÉNTICO en los sitios de Mauricio y de Fernanda.
import { useEffect, useState } from 'preact/hooks';
import { db } from '../../lib/db';
import { SOCIAL_CATALOG, SOCIAL_BY_KEY } from '../../data/social-icons';

interface Net { key: string; url: string; show: boolean }

export default function SocialsEditor({ siteId }: { siteId: string }) {
  const [rows, setRows] = useState<Net[]>([]);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [data, setData] = useState<Record<string, any>>({});
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [toAdd, setToAdd] = useState('');

  async function load() {
    const { data: row, error } = await db.from('site_settings').select('id, data').eq('site', siteId).maybeSingle();
    if (error) { setStatus(`No se pudo cargar: ${error.message}`); return; }
    setSettingsId(row?.id ?? null);
    const d = (row?.data ?? {}) as Record<string, any>;
    setData(d);
    const n = d.networks;
    setRows(Array.isArray(n)
      ? n.map((x: any) => ({ key: x.key, url: x.url ?? '', show: x.show !== false }))
      : Object.entries(n ?? {}).map(([key, url]) => ({ key, url: String(url ?? ''), show: true })));
  }
  useEffect(() => { load(); }, []);

  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[i], next[j]] = [next[j], next[i]];
    setRows(next);
  };
  const patch = (i: number, p: Partial<Net>) => setRows(rows.map((r, k) => (k === i ? { ...r, ...p } : r)));
  const available = SOCIAL_CATALOG.filter((s) => !rows.some((r) => r.key === s.key));

  async function save() {
    setBusy(true);
    setStatus('');
    const payload = { ...data, networks: rows.map((r) => ({ key: r.key, url: r.url.trim(), show: r.show })) };
    const res = settingsId
      ? await db.from('site_settings').update({ data: payload }).eq('id', settingsId)
      : await db.from('site_settings').insert({ site: siteId, data: payload });
    setBusy(false);
    if (res.error) { setStatus(`No se pudo guardar: ${res.error.message}`); return; }
    setStatus('Guardado. El sitio se actualiza solo en 1 o 2 minutos.');
    await load();
  }

  return (
    <div class="pt-abm">
      <h2>Redes sociales</h2>
      <p class="pt-form-note">Mostrá u ocultá cada red, cambiá su enlace y ordenalas. Una red visible sin enlace se ve como marcador «pendiente».</p>
      {status && <p class="pt-form-status" role="status">{status}</p>}
      <ul class="pt-social-rows">
        {rows.map((r, i) => {
          const def = SOCIAL_BY_KEY[r.key];
          return (
            <li class="pt-social-row">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d={def?.path ?? ''} /></svg>
              <strong>{def?.label ?? r.key}</strong>
              <input type="text" value={r.url} placeholder={r.key === 'email' ? 'correo@ejemplo.com' : 'https://…'} aria-label={`Enlace de ${def?.label ?? r.key}`} onInput={(e) => patch(i, { url: (e.target as HTMLInputElement).value })} />
              <label class="pt-social-show"><input type="checkbox" checked={r.show} onChange={(e) => patch(i, { show: (e.target as HTMLInputElement).checked })} /> Mostrar</label>
              <button type="button" class="pt-admin-link" onClick={() => move(i, -1)} aria-label="Subir" disabled={i === 0}>↑</button>
              <button type="button" class="pt-admin-link" onClick={() => move(i, 1)} aria-label="Bajar" disabled={i === rows.length - 1}>↓</button>
              <button type="button" class="pt-admin-link pt-admin-danger" onClick={() => setRows(rows.filter((_, k) => k !== i))}>Quitar</button>
            </li>
          );
        })}
      </ul>
      <div class="pt-form-actions">
        <select value={toAdd} onChange={(e) => setToAdd((e.target as HTMLSelectElement).value)} aria-label="Red para agregar">
          <option value="">Agregar una red…</option>
          {available.map((s) => <option value={s.key}>{s.label}</option>)}
        </select>
        <button type="button" class="pt-admin-link" disabled={!toAdd} onClick={() => { setRows([...rows, { key: toAdd, url: '', show: true }]); setToAdd(''); }}>Agregar</button>
        <button type="button" class="pt-button" onClick={save} disabled={busy}>Guardar</button>
      </div>
    </div>
  );
}
