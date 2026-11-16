// Carcasa única del administrador: login, sesión, menú lateral por grupos y módulos.
// Archivo IDÉNTICO en los sitios de Mauricio y de Fernanda. Cada sitio define sus módulos en AdminApp.tsx.
import { useEffect, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { db, markSessionStart, clearSessionStart, scheduleSessionEnd, enforceSessionExpiry, resolveLoginUser } from '../../lib/db';

export interface AdminModule {
  id: string;
  group: string;
  label: string;
  render: () => ComponentChildren;
}

interface Props { siteId: string; siteName: string; modules: AdminModule[] }

// Destino tras iniciar sesión (lo manda OwnerGuard). Solo rutas relativas del mismo sitio.
function safeNext(): string | null {
  const n = new URLSearchParams(location.search).get('next');
  if (!n || !n.startsWith('/') || n.startsWith('//') || n.includes('\\')) return null;
  if (n.startsWith('/admin')) return null;
  return n;
}

export default function AdminShell({ siteId, siteName, modules }: Props) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [allowed, setAllowed] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState(modules[0]?.id ?? '');
  const [menuOpen, setMenuOpen] = useState(false);

  async function checkProfile(u: any) {
    const { data } = await db.from('profiles').select('role, site').eq('id', u.id).maybeSingle();
    const ok = data?.role === 'admin' && (data.site === siteId || data.site === '*');
    setAllowed(ok);
    return ok;
  }

  useEffect(() => {
    const fromHash = () => {
      const hash = (location.hash || '').replace('#', '');
      if (modules.some((m) => m.id === hash)) setActive(hash);
    };
    fromHash();
    window.addEventListener('hashchange', fromHash);
    (async () => {
      if (await enforceSessionExpiry()) { setLoading(false); return; }
      const { data } = await db.auth.getSession();
      if (data?.session?.user) {
        setUser(data.session.user);
        const ok = await checkProfile(data.session.user);
        const next = safeNext();
        if (ok && next) { location.replace(next); return; }
        if (ok) scheduleSessionEnd(() => logout(true));
      }
      setLoading(false);
    })();
  }, []);

  async function login(e: Event) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const { data, error: err } = await db.auth.signInWithPassword({ email: resolveLoginUser(email), password });
      if (err) throw err;
      if (!data.user) throw new Error('No se pudo iniciar sesión.');
      setPassword('');
      setUser(data.user);
      markSessionStart();
      const ok = await checkProfile(data.user);
      if (ok) {
        scheduleSessionEnd(() => logout(true));
        const next = safeNext();
        if (next) { location.replace(next); return; }
      }
    } catch (e) {
      setError((e as Error).message === 'Invalid login credentials' ? 'Correo o contraseña incorrectos.' : (e as Error).message || 'Error al iniciar sesión');
    } finally { setBusy(false); }
  }

  async function logout(auto = false) {
    if (!auto) clearSessionStart();
    await db.auth.signOut();
    setUser(null);
    setAllowed(false);
  }

  function go(id: string) {
    setActive(id);
    setMenuOpen(false);
    history.replaceState(null, '', '#' + id);
  }

  if (!allowed) {
    return (
      <div class="pt-admin-login">
        <h2>Panel de {siteName}</h2>
        {loading ? <p>Cargando…</p> : user ? (
          <>
            <p class="pt-error" role="alert">Tu usuario no tiene permiso de administración para este sitio.</p>
            <button class="pt-button" type="button" onClick={() => logout()}>Cerrar sesión</button>
          </>
        ) : (
          <form class="pt-form" onSubmit={login}>
            <div class="pt-field">
              <label for="a-user">Correo electrónico</label>
              <input id="a-user" type="text" value={email} onInput={(e) => setEmail((e.target as HTMLInputElement).value)} autocomplete="username" required />
            </div>
            <div class="pt-field">
              <label for="a-pass">Contraseña</label>
              <input id="a-pass" type="password" value={password} onInput={(e) => setPassword((e.target as HTMLInputElement).value)} autocomplete="current-password" required />
            </div>
            {error && <p class="pt-error" role="alert">{error}</p>}
            <div class="pt-form-actions"><button class="pt-button" type="submit" disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</button></div>
          </form>
        )}
        <p class="pt-admin-back"><a class="pt-link-gold" href="/">← Volver al sitio</a></p>
      </div>
    );
  }

  const groups = [...new Set(modules.map((m) => m.group))];
  const current = modules.find((m) => m.id === active) ?? modules[0];

  return (
    <div class="pt-shell">
      <div class="pt-shell-bar">
        <button class="pt-shell-toggle" type="button" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen}>Menú del panel</button>
        <strong>Panel de {siteName}</strong>
        <span class="pt-shell-user">{user?.email}</span>
        <a class="pt-admin-link" href="/">Ver el sitio</a>
        <button class="pt-admin-link" type="button" onClick={() => logout()}>Salir</button>
      </div>
      <div class="pt-shell-body">
        <nav class={'pt-shell-nav' + (menuOpen ? ' is-open' : '')} aria-label="Secciones del panel">
          {groups.map((g) => (
            <div class="pt-shell-group">
              <p class="pt-shell-group-title">{g}</p>
              {modules.filter((m) => m.group === g).map((m) => (
                <button type="button" class={m.id === current.id ? 'is-on' : ''} aria-current={m.id === current.id ? 'page' : undefined} onClick={() => go(m.id)}>{m.label}</button>
              ))}
            </div>
          ))}
        </nav>
        <section class="pt-shell-content" key={current.id}>{current.render()}</section>
      </div>
    </div>
  );
}
