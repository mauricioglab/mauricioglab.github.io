import { useEffect, useState } from 'preact/hooks';
import { db } from '../../lib/db';
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
  { key: 'disertaciones', icon: '🎤', label: 'Eventos', total: 0, published: 0, draft: 0 },
  { key: 'movimiento', icon: '🤸', label: 'Movimiento', total: 0, published: 0, draft: 0 },
  { key: 'recursos', icon: '📚', label: 'Zona Lab', total: 0, published: 0, draft: 0 },
];

export default function ResumenPanel({ go }: { go: (id: string) => void }) {
  const [statsLoading, setStatsLoading] = useState(true);
  const [dashboardCards, setDashboardCards] = useState<DashboardCard[]>(INITIAL_CARDS);

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

  useEffect(() => { loadStats(); }, []);

  return (
            <div class="space-y-6">
              <div>
                <h2 class="text-base font-bold mb-3">📊 Resumen de contenido</h2>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {dashboardCards.map((card) => (
                    <button key={card.key} onClick={() => go(card.key === 'recursos' ? 'recursos' : card.key)} class="text-left bg-[#f4f6fa] hover:bg-[#e2e7ef] transition rounded-xl p-4">
                      <div class="flex items-center gap-2 text-sm text-[#5c6785] mb-2">
                        <span>{card.icon}</span>
                        <span>{card.label}</span>
                      </div>
                      {statsLoading ? (
                        <div class="h-7 w-10 skeleton rounded"></div>
                      ) : (
                        <div>
                          <p class="text-2xl font-bold">{card.total}</p>
                          <p class="text-xs text-[#6b7490]">
                            {card.published} publicados · {card.draft} borradores
                          </p>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div class="flex items-center justify-between">
                <p class="text-sm text-[#5c6785]">{TOTAL_PAGES} páginas en el sitio</p>
                <a href="/" class="text-sm text-[#5c6785] hover:text-[#082D3A]">
                  ← Inicio
                </a>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PAGES_BY_CATEGORY.map((group) => (
                  <section key={group.category} class="bg-[#f4f6fa] rounded-xl p-4">
                    <h2 class="text-base font-bold mb-3 flex items-center gap-2">
                      {CATEGORY_ICON[group.category]}
                      {group.label}
                      <span class="text-xs font-normal text-[#6b7490]">({group.pages.length})</span>
                    </h2>
                    <div class="space-y-1">
                      {group.pages.map((page) => (
                        <a key={page.url} href={page.url} class="flex items-center gap-2 p-2 rounded-lg bg-[#f4f6fa] hover:bg-[#e2e7ef] transition group text-sm">
                          {page.icon && <span>{page.icon}</span>}
                          <span class="text-[#082D3A] group-hover:text-[#082D3A] transition truncate">{page.name}</span>
                        </a>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </div>
  );
}
