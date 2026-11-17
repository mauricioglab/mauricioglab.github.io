// Editor de secciones del sitio: casillas para mostrar u ocultar cada sección. Guarda en site_settings.data.sections.
// ARCHIVO IDÉNTICO en los sitios de Mauricio y de Fernanda; cada sitio le pasa las secciones que tiene.
import { useEffect, useState } from 'preact/hooks';
import { db } from '../../lib/db';

export interface SectionItem { key: string; label: string; hint?: string }

export default function SectionsEditor({ siteId, items }: { siteId: string; items: SectionItem[] }) {
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [data, setData] = useState<Record<string, any>>({});
  const [on, setOn] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    const { data: row, error } = await db.from('site_settings').select('id, data').eq('site', siteId).maybeSingle();
    if (error) { setStatus(`No se pudo cargar: ${error.message}`); return; }
    setSettingsId(row?.id ?? null);
    const d = (row?.data ?? {}) as Record<string, any>;
    setData(d);
    const s = (d.sections ?? {}) as Record<string, boolean>;
    setOn(Object.fromEntries(items.map((it) => [it.key, s[it.key] !== false])));
  }
  useEffect(() => { load(); }, []);

  async function save() {
    setBusy(true);
    setStatus('');
    const payload = { ...data, sections: { ...(data.sections ?? {}), ...on } };
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
      <h2>Secciones del sitio</h2>
      <p class="pt-form-note">Activá o desactivá las secciones opcionales. Una sección desactivada deja de aparecer en el menú y en los enlaces.</p>
      {status && <p class="pt-form-status" role="status">{status}</p>}
      <ul class="pt-social-rows">
        {items.map((it) => (
          <li class="pt-social-row">
            <label class="pt-social-show">
              <input type="checkbox" checked={!!on[it.key]} onChange={(e) => setOn({ ...on, [it.key]: (e.target as HTMLInputElement).checked })} />
              <strong> {it.label}</strong>
            </label>
            {it.hint && <span class="pt-form-note">{it.hint}</span>}
          </li>
        ))}
      </ul>
      <div class="pt-form-actions">
        <button type="button" class="pt-button" onClick={save} disabled={busy}>Guardar</button>
      </div>
    </div>
  );
}
