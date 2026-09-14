import { useEffect, useState } from 'preact/hooks';
import BlogAdminPreact from './BlogAdminPreact';
import DisertacionesAdminPreact from './DisertacionesAdminPreact';
import MovimientoAdminPreact from './MovimientoAdminPreact';
import RecursosAdminPreact from './RecursosAdminPreact';
import {
  db,
  resolveLoginUser,
  markSessionStart,
  clearSessionStart,
  scheduleSessionEnd,
  enforceSessionExpiry,
} from '../../lib/db';
import { getAllPages, getPagesByCategory, categoryLabels, type PageCategory } from '../../data/pages-registry';

const BASE = import.meta.env.BASE_URL;
const B = BASE.endsWith('/') ? BASE : `${BASE}/`;

const CATEGORIES: PageCategory[] = ['public', 'landing', 'project', 'tool'];
const PAGES_BY_CATEGORY = CATEGORIES.map((cat) => ({
  category: cat,
  label: categoryLabels[cat],
  pages: getPagesByCategory(cat).map((p) => ({
    ...p,
    url: p.url.startsWith('/') ? `${B}${p.url.slice(1)}` : p.url,
  })),
})).filter((c) => c.pages.length > 0);
const TOTAL_PAGES = getAllPages().length;

const CATEGORY_ICON: Record<PageCategory, string> = {
  public: '🌐',
  landing: '🚀',
  project: '📁',
  tool: '🛠️',
};

const TABS = ['enlaces', 'blog', 'disertaciones', 'movimiento', 'recursos'] as const;
type Tab = (typeof TABS)[number];

interface DashboardCard {
  key: 'blog' | 'disertaciones' | 'movimiento' | 'recursos';
  icon: string;
  label: string;
  total: number;
  published: number;
  draft: number;
}

const INITIAL_CARDS: DashboardCard[] = [
  { key: 'blog', icon: '📝', label: 'Blog', total: 0, published: 0, draft: 0 },
  { key: 'disertaciones', icon: '🎤', label: 'Disertaciones', total: 0, published: 0, draft: 0 },
  { key: 'movimiento', icon: '🤸', label: 'Movimiento', total: 0, published: 0, draft: 0 },
  { key: 'recursos', icon: '📚', label: 'Zona Lab', total: 0, published: 0, draft: 0 },
];

export default function GestionAdminPreact() {
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loginEmail, setLoginEmail] = useState('cervantes');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [busy, setBusy] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('enlaces');
  const [statsLoading, setStatsLoading] = useState(true);
  const [dashboardCards, setDashboardCards] = useState<DashboardCard[]>(INITIAL_CARDS);

  async function loadProfile(userId: string) {
    const { data } = await db.from('profiles').select('role').eq('id', userId).maybeSingle();
    const role = data?.role || null;
    setUserRole(role);
    return role;
  }

  async function loadStats() {
    setStatsLoading(true);
    try {
      const count = (rows: any[], isDraft: (r: any) => boolean) => {
        const total = rows.length;
        const draft = rows.filter(isDraft).length;
        return { total, draft, published: total - draft };
      };
      const [blogs, disertaciones, movimiento, recursos] = await Promise.all([
        db.from('blogs').select('id, draft'),
        db.from('disertaciones').select('id, draft'),
        db.from('movimiento_programas').select('id, data'),
        db.from('recursos').select('id, draft'),
      ]);
      const s: Record<DashboardCard['key'], { total: number; draft: number; published: number }> = {
        blog: count(blogs.data || [], (r) => !!r.draft),
        disertaciones: count(disertaciones.data || [], (r) => !!r.draft),
        movimiento: count(movimiento.data || [], (r) => !!r.data?.draft),
        recursos: count(recursos.data || [], (r) => !!r.draft),
      };
      setDashboardCards((cards) => cards.map((c) => ({ ...c, ...s[c.key] })));
    } finally {
      setStatsLoading(false);
    }
  }

  useEffect(() => {
    const hash = (location.hash || '').replace('#', '');
    if ((TABS as readonly string[]).includes(hash)) setActiveTab(hash as Tab);

    (async () => {
      if (await enforceSessionExpiry()) {
        setLoadingAuth(false);
        return;
      }
      const { data } = await db.auth.getSession();
      if (data?.session?.user) {
        setUser(data.session.user);
        const role = await loadProfile(data.session.user.id);
        if (role === 'admin') loadStats();
      }
      setLoadingAuth(false);
    })();
  }, []);

  async function login(e: Event) {
    e.preventDefault();
    setLoginError('');
    setBusy(true);
    try {
      const { data, error } = await db.auth.signInWithPassword({
        email: resolveLoginUser(loginEmail),
        password: loginPassword,
      });
      if (error) throw error;
      if (!data.user) throw new Error('No se pudo iniciar sesión.');
      setUser(data.user);
      setLoginPassword('');
      const role = await loadProfile(data.user.id);
      markSessionStart();
      scheduleSessionEnd(() => logout(true));
      if (role === 'admin') loadStats();
    } catch (e) {
      setLoginError((e as Error).message || 'Error al iniciar sesión');
    } finally {
      setBusy(false);
    }
  }

  async function logout(auto = false) {
    if (!auto) clearSessionStart();
    await db.auth.signOut();
    setUser(null);
    setUserRole(null);
  }

  function setTab(tab: Tab) {
    setActiveTab(tab);
    history.replaceState(null, '', '#' + tab);
  }

  const isAdmin = !!user && userRole === 'admin';

  return (
    <div class="min-h-screen bg-slate-900 text-white">
      {/* ============ LOGIN / GATE ============ */}
      {!isAdmin && (
        <div class="min-h-screen flex items-center justify-center p-6">
          <div class="w-full max-w-sm">
            <div class="bg-slate-800 rounded-xl p-6 shadow-xl">
              <h1 class="text-xl font-bold mb-1">🗂️ Panel de Gestión</h1>
              <p class="text-sm text-slate-400 mb-4">Acceso restringido al equipo docente.</p>

              {user && userRole && userRole !== 'admin' && (
                <div>
                  <p class="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
                    Tu usuario no tiene rol <strong>admin</strong>. Contactá al administrador.
                  </p>
                  <button onClick={() => logout()} class="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold rounded-lg">
                    Cerrar sesión
                  </button>
                </div>
              )}

              {!user && (
                <div>
                  {loadingAuth ? (
                    <div class="text-center text-sm text-slate-400 py-6">Cargando...</div>
                  ) : (
                    <form onSubmit={login}>
                      <div class="mb-3">
                        <label class="block text-xs font-bold text-slate-300 mb-1">Usuario o Email</label>
                        <input
                          value={loginEmail}
                          onInput={(e) => setLoginEmail((e.target as HTMLInputElement).value)}
                          type="text"
                          class="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        />
                      </div>
                      <div class="mb-4">
                        <label class="block text-xs font-bold text-slate-300 mb-1">Contraseña</label>
                        <input
                          value={loginPassword}
                          onInput={(e) => setLoginPassword((e.target as HTMLInputElement).value)}
                          type="password"
                          class="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                          required
                        />
                      </div>
                      {loginError && <p class="text-xs text-red-400 mb-3 font-bold">{loginError}</p>}
                      <button type="submit" class="w-full py-2 bg-indigo-700 hover:bg-indigo-800 text-white text-sm font-bold rounded-lg" disabled={loadingAuth || busy}>
                        {busy ? '...' : 'Ingresar'}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============ GESTIÓN ============ */}
      {isAdmin && (
        <div class="max-w-7xl mx-auto p-4 md:p-6">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h1 class="text-2xl font-bold">🗂️ Panel de Gestión</h1>
              <p class="text-sm text-slate-400">{user ? user.email : ''}</p>
            </div>
            <button onClick={() => logout()} class="px-3 py-1.5 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 text-sm">
              Salir
            </button>
          </div>

          <div class="border-b border-slate-700 mb-6 flex gap-1 overflow-x-auto" role="tablist">
            {(
              [
                ['enlaces', '🔗 Enlaces'],
                ['blog', '📝 Blog'],
                ['disertaciones', '🎤 Disertaciones'],
                ['movimiento', '🤸 Movimiento'],
                ['recursos', '📚 Zona Lab'],
              ] as [Tab, string][]
            ).map(([tab, label]) => (
              <button
                key={tab}
                onClick={() => setTab(tab)}
                class={
                  'px-4 py-2.5 text-sm font-bold border-b-2 -mb-px transition whitespace-nowrap ' +
                  (activeTab === tab ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200')
                }
                role="tab"
                aria-selected={activeTab === tab}
              >
                {label}
              </button>
            ))}
          </div>

          {activeTab === 'enlaces' && (
            <div class="space-y-6">
              <div>
                <h2 class="text-base font-bold mb-3">📊 Resumen de contenido</h2>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {dashboardCards.map((card) => (
                    <button key={card.key} onClick={() => setTab(card.key)} class="text-left bg-slate-800 hover:bg-slate-700/80 transition rounded-xl p-4">
                      <div class="flex items-center gap-2 text-sm text-slate-400 mb-2">
                        <span>{card.icon}</span>
                        <span>{card.label}</span>
                      </div>
                      {statsLoading ? (
                        <div class="h-7 w-10 skeleton rounded"></div>
                      ) : (
                        <div>
                          <p class="text-2xl font-bold">{card.total}</p>
                          <p class="text-xs text-slate-500">
                            {card.published} publicados · {card.draft} borradores
                          </p>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div class="flex items-center justify-between">
                <p class="text-sm text-slate-400">{TOTAL_PAGES} páginas en el sitio</p>
                <a href={B} class="text-sm text-slate-400 hover:text-white">
                  ← Inicio
                </a>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PAGES_BY_CATEGORY.map((group) => (
                  <section key={group.category} class="bg-slate-800 rounded-xl p-4">
                    <h2 class="text-base font-bold mb-3 flex items-center gap-2">
                      {CATEGORY_ICON[group.category]}
                      {group.label}
                      <span class="text-xs font-normal text-slate-500">({group.pages.length})</span>
                    </h2>
                    <div class="space-y-1">
                      {group.pages.map((page) => (
                        <a key={page.url} href={page.url} class="flex items-center gap-2 p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition group text-sm">
                          {page.icon && <span>{page.icon}</span>}
                          <span class="text-slate-200 group-hover:text-white transition truncate">{page.name}</span>
                        </a>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'blog' && <BlogAdminPreact />}
          {activeTab === 'disertaciones' && <DisertacionesAdminPreact />}
          {activeTab === 'movimiento' && <MovimientoAdminPreact />}
          {activeTab === 'recursos' && <RecursosAdminPreact />}
        </div>
      )}

      <style>{`
        @keyframes mglab-spin { to { transform: rotate(360deg); } }
        .spinner { display: inline-block; border-radius: 9999px; border: 2px solid rgba(255,255,255,.18); border-top-color: #818cf8; animation: mglab-spin .7s linear infinite; vertical-align: middle; }
        .spinner-sm { width: 14px; height: 14px; }
        .spinner-xs { width: 10px; height: 10px; border-width: 2px; }
        @keyframes mglab-shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        .shimmer-bar { position: relative; overflow: hidden; background: rgba(99,102,241,.18); }
        .shimmer-bar::after { content: ""; position: absolute; top: 0; bottom: 0; left: 0; width: 40%; background: linear-gradient(90deg, transparent, rgba(129,140,248,.8), transparent); animation: mglab-shimmer 1.1s infinite; }
        .skeleton { position: relative; overflow: hidden; background: rgba(255,255,255,.06); border-radius: 8px; }
        .skeleton::after { content: ""; position: absolute; top: 0; bottom: 0; left: 0; width: 60%; background: linear-gradient(90deg, transparent, rgba(255,255,255,.12), transparent); transform: translateX(-100%); animation: mglab-shimmer 1.3s infinite; }
        .markdown-preview h1, .markdown-preview h2, .markdown-preview h3 { font-weight: 700; margin: 0.75em 0 0.4em; }
        .markdown-preview h1 { font-size: 1.4em; } .markdown-preview h2 { font-size: 1.2em; } .markdown-preview h3 { font-size: 1.05em; }
        .markdown-preview p { margin: 0.5em 0; }
        .markdown-preview ul, .markdown-preview ol { margin: 0.5em 0 0.5em 1.4em; list-style: disc; }
        .markdown-preview ol { list-style: decimal; }
        .markdown-preview code { background: #0f172a; padding: 1px 5px; border-radius: 4px; font-size: 0.9em; }
        .markdown-preview pre { background: #0f172a; padding: 10px; border-radius: 6px; overflow-x: auto; margin: 0.5em 0; }
        .markdown-preview pre code { background: transparent; padding: 0; }
        .markdown-preview blockquote { border-left: 3px solid #6366f1; padding-left: 12px; color: #94a3b8; font-style: italic; margin: 0.5em 0; }
        .markdown-preview a { color: #818cf8; text-decoration: underline; }
        .markdown-preview img { max-width: 100%; border-radius: 6px; }
        .markdown-preview strong { font-weight: 700; }
        .markdown-preview em { font-style: italic; }
      `}</style>
    </div>
  );
}
