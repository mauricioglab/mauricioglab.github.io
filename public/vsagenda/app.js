'use strict';

const STORAGE_KEY    = 'vsagenda:v1';
const LOCALE_KEY     = 'vsagenda:locale';
const VIEW_KEY       = 'vsagenda:view';
const OFFSETS        = [0, 1, 2, 3, 4, 5, 6, 7];
const TAB_LABELS     = ['HOY', '+1', '+2', '+3', '+4', '+5', '+6', '+7'];
const VENCIDO_PREFIX = '! vencido ';
const VENCIDO_SEP    = '---';
const ITEM_PREFIX    = '›';
const SUPPORTED      = ['es-AR', 'es-ES', 'en-US', 'pt-BR', 'fr-FR'];

const TAG_COLOR_MAP = {
  urgente: 'red', alta: 'red', critico: 'red', critical: 'red',
  bug: 'red', fix: 'red', error: 'red',
  idea: 'cyan', brainstorm: 'cyan', creatividad: 'cyan',
  trabajo: 'blue', work: 'blue', oficina: 'blue', job: 'blue',
  personal: 'green',
  estudio: 'purple', study: 'purple', aprender: 'purple', curso: 'purple',
  salud: 'green', health: 'green', gym: 'green', ejercicio: 'green', deporte: 'green',
  finanzas: 'yellow', money: 'yellow', pagar: 'yellow', deuda: 'yellow', compra: 'yellow',
  casa: 'orange', home: 'orange', familia: 'orange',
  cumple: 'pink', cumpleanos: 'pink', evento: 'pink',
  amor: 'pink',
};

const SNIPPETS = [
  { trigger: '//bug',   expansion: '› [BUG] ',     description: 'Marcar como bug',         category: 'Snippet' },
  { trigger: '//fixme', expansion: '› [FIXME] ',   description: 'Pendiente de fix',        category: 'Snippet' },
  { trigger: '//idea',  expansion: '› [IDEA] ',    description: 'Nota mental / idea',      category: 'Snippet' },
  { trigger: '//todo',  expansion: '› [TODO] ',    description: 'Tarea por hacer',         category: 'Snippet' },
  { trigger: '//wait',  expansion: '› [WAITING] ', description: 'Esperando respuesta',     category: 'Snippet' },
  { trigger: '//done',  expansion: '✓ ',           description: 'Marcar como hecho',       category: 'Snippet' },
  { trigger: '//meet',  expansion: '› [REUNIÓN] ', description: 'Reunión / meeting',       category: 'Snippet' },
  { trigger: '//call',  expansion: '› [LLAMADA] ', description: 'Llamar a alguien',        category: 'Snippet' },
  { trigger: '//buy',   expansion: '› [COMPRAR] ', description: 'Comprar',                 category: 'Snippet' },
  { trigger: '//mail',  expansion: '› [MAIL] ',    description: 'Email / correo',          category: 'Snippet' },
  { trigger: '//pay',   expansion: '› [PAGAR] ',   description: 'Pagar cuenta / servicio', category: 'Snippet' },
  { trigger: '//read',  expansion: '› [LEER] ',    description: 'Leer (artículo, libro)',  category: 'Snippet' },
];

const PRIO_HIGH_RE = /^›\s*!/;
const PRIO_MID_RE  = /^›\s*\?/;
const PRIO_DONE_RE = /^✓/;

/* Item line grammar: [indent] (› | ✓) [~!?*]... text
   ~ = en progreso, ! = urgente, ? = dudosa, * = importante (combinables, ej: ›~!* ) */
const ITEM_LINE_RE = /^(✓|›)\s*([!~?*])?\s*([!~?*])?\s*(.*)$/;

const state = {
  days: {},
  lastVisit: null,
  focusedDay: null,
  locale: 'es-AR'
};

const els = {};
let saveTimer = null;
let deferredPrompt = null;

/* ============================================================
   Date utilities
   ============================================================ */

function toIsoDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function dateForOffset(offset) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d;
}

function isoToDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDateLong(d) {
  try {
    return d.toLocaleDateString(state.locale, {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  } catch {
    return d.toDateString();
  }
}

function formatDateShort(d) {
  try {
    return d.toLocaleDateString(state.locale, {
      day: '2-digit', month: '2-digit'
    });
  } catch {
    return d.toDateString();
  }
}

function formatWeekdayShort(d) {
  try {
    return d.toLocaleDateString(state.locale, { weekday: 'short' });
  } catch {
    return '';
  }
}

function formatWeekdayLong(d) {
  try {
    return d.toLocaleDateString(state.locale, { weekday: 'long' });
  } catch {
    return '';
  }
}

/* ============================================================
   Persistence
   ============================================================ */

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      state.days = parsed.days && typeof parsed.days === 'object' ? parsed.days : {};
      state.lastVisit = parsed.lastVisit || null;
    }
  } catch (e) {
    console.warn('load error', e);
  }
}

function loadLocale() {
  const stored = localStorage.getItem(LOCALE_KEY);
  if (stored && SUPPORTED.includes(stored)) { state.locale = stored; return; }
  const browser = (navigator.language || '').toLowerCase();
  const match = SUPPORTED.find((l) =>
    browser === l.toLowerCase() || browser.startsWith(l.toLowerCase().split('-')[0])
  );
  state.locale = match || 'es-AR';
}

function persistLocale() {
  try { localStorage.setItem(LOCALE_KEY, state.locale); } catch {}
}

function setSaveStatus(status) {
  const el = els.statusSave;
  if (!el) return;
  el.classList.remove('saved', 'saving', 'error');
  el.classList.add(status);
  el.textContent = status === 'saved' ? '●' : status === 'saving' ? '◐' : '✕';
  el.title = status === 'saved' ? 'guardado' : status === 'saving' ? 'guardando…' : 'error';
}

function saveState(immediate = false) {
  if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
  setSaveStatus('saving');
  const doSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        days: state.days,
        lastVisit: state.lastVisit
      }));
      setSaveStatus('saved');
    } catch (e) {
      console.error('save error', e);
      setSaveStatus('error');
    }
  };
  if (immediate) doSave();
  else saveTimer = setTimeout(doSave, 300);
}

/* ============================================================
   Roll-forward
   ============================================================ */

function rollForward() {
  const todayIso = toIsoDate(dateForOffset(0));
  const expired = [];
  for (const iso of Object.keys(state.days)) {
    if (iso < todayIso) {
      const content = (state.days[iso] || '').replace(/\s+$/, '');
      if (content) {
        expired.push({ iso, content, formatted: formatDateShort(isoToDate(iso)) });
      }
      delete state.days[iso];
    }
  }
  if (expired.length) {
    expired.sort((a, b) => a.iso.localeCompare(b.iso));
    const blocks = expired.map((e) => `${VENCIDO_PREFIX}${e.formatted}\n${e.content}`);
    const today = state.days[todayIso] || '';
    const sep = today && !today.endsWith('\n') ? '\n' : '';
    state.days[todayIso] = blocks.join('\n' + VENCIDO_SEP + '\n') + sep + today;
  }
  state.lastVisit = todayIso;
  saveState(true);
}

/* ============================================================
   Item counting
   ============================================================ */

function countItems(content) {
  if (!content) return 0;
  let n = 0;
  for (const line of content.split('\n')) {
    if (line.match(/^\s*›\s/)) n++;
  }
  return n;
}

function hasVencidos(content) {
  return !!(content && content.includes(VENCIDO_PREFIX));
}

/* ============================================================
   Render — Day list (cards)
   ============================================================ */

function renderDayList() {
  els.daylist.innerHTML = '';
  OFFSETS.forEach((offset, idx) => {
    const date = dateForOffset(offset);
    const iso = toIsoDate(date);
    const content = state.days[iso] || '';
    const items = countItems(content);
    const vencidos = hasVencidos(content);

    const card = document.createElement('section');
    card.className = 'day-card';
    card.dataset.day = iso;
    card.dataset.offset = offset;
    card.dataset.idx = idx;
    card.setAttribute('role', 'listitem');

    const header = document.createElement('header');
    header.className = 'day-card-header';

    const offsetEl = document.createElement('span');
    offsetEl.className = 'day-card-offset';
    offsetEl.textContent = TAB_LABELS[idx];

    const weekdayEl = document.createElement('span');
    weekdayEl.className = 'day-card-weekday';
    weekdayEl.textContent = formatWeekdayLong(date);

    const dateEl = document.createElement('span');
    dateEl.className = 'day-card-date';
    dateEl.textContent = formatDateShort(date);

    header.appendChild(offsetEl);
    header.appendChild(weekdayEl);
    header.appendChild(dateEl);

    if (items > 0 || vencidos) {
      const badge = document.createElement('span');
      badge.className = 'day-card-badge' + (vencidos ? ' vencido' : '');
      badge.dataset.role = 'badge';
      badge.textContent = vencidos ? `!${items}` : `·${items}`;
      header.appendChild(badge);
    }

    const meta = document.createElement('div');
    meta.className = 'day-card-meta';
    meta.dataset.role = 'meta';
    meta.hidden = true;

    const ta = document.createElement('textarea');
    ta.id = `ta-${iso}`;
    ta.className = 'day-card-textarea';
    ta.dataset.day = iso;
    ta.dataset.offset = offset;
    ta.spellcheck = false;
    ta.autocomplete = 'off';
    ta.autocorrect = 'off';
    ta.autocapitalize = 'off';
    ta.wrap = 'off';
    ta.value = content;
    ta.placeholder = offset === 0 ? '› empezá escribiendo ítems…' : '';

    ta.addEventListener('input',   () => onInput(iso, ta));
    ta.addEventListener('keydown', (e) => onKeyDown(e, iso, ta));
    ta.addEventListener('blur',    () => saveState());
    ta.addEventListener('focus',   () => onFocus(iso, ta));
    ta.addEventListener('click',   () => updateCursorStatus(ta));
    ta.addEventListener('keyup',   () => updateCursorStatus(ta));

    header.addEventListener('mousedown', (e) => {
      if (e.target === ta) return;
      e.preventDefault();
      ta.focus();
    });

    card.appendChild(header);
    card.appendChild(meta);
    card.appendChild(ta);
    els.daylist.appendChild(card);

    refreshCardDecorations(card, content);
  });
}

function refreshCardDecorations(card, content) {
  if (!card) return;
  const header = card.querySelector('.day-card-header');
  const meta   = card.querySelector('.day-card-meta');
  if (!header || !meta) return;
  const text = content ?? (card.querySelector('textarea')?.value ?? '');
  const items = countItems(text);
  const vencidos = hasVencidos(text);

  let badge = header.querySelector('.day-card-badge');
  if (items > 0 || vencidos) {
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'day-card-badge';
      badge.dataset.role = 'badge';
      header.appendChild(badge);
    }
    badge.classList.toggle('vencido', !!vencidos);
    badge.textContent = vencidos ? `!${items}` : `·${items}`;
  } else if (badge) {
    badge.remove();
  }

  const tags = extractTags(text);
  const prio = parsePriorities(text);
  const hasTags = tags.length > 0;
  const hasPrio = prio.high || prio.mid || prio.done;

  if (!hasTags && !hasPrio) {
    meta.innerHTML = '';
    meta.hidden = true;
    return;
  }

  meta.hidden = false;
  const parts = [];

  if (hasTags) {
    parts.push(tags.map((t) => {
      const color = TAG_COLOR_MAP[t] || 'blue';
      return `<span class="tag-chip" data-color="${color}">#${escapeHtml(t)}</span>`;
    }).join(''));
  }

  if (hasTags && hasPrio) {
    parts.push('<span class="day-card-meta-sep"></span>');
  }

  if (hasPrio) {
    const bits = [];
    if (prio.high) bits.push(`<span class="prio-badge" data-prio="high" title="líneas urgentes">!${prio.high}</span>`);
    if (prio.mid)  bits.push(`<span class="prio-badge" data-prio="mid"  title="líneas dudosas">?${prio.mid}</span>`);
    if (prio.done) bits.push(`<span class="prio-badge" data-prio="done" title="líneas hechas">✓${prio.done}</span>`);
    parts.push(bits.join(''));
  }

  meta.innerHTML = parts.join('');
}

function extractTags(text) {
  if (!text) return [];
  const out = new Set();
  const re = /#([a-zA-Z][\w-]*)/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    out.add(m[1].toLowerCase());
  }
  return Array.from(out);
}

function parsePriorities(text) {
  const result = { high: 0, mid: 0, done: 0, total: 0 };
  if (!text) return result;
  for (const line of text.split('\n')) {
    const item = parseItemLine(line);
    if (!item) continue;
    result.total++;
    if (item.done)           result.done++;
    else if (item.urgent)    result.high++;
    else if (item.doubt)     result.mid++;
  }
  return result;
}

function updateCardBadge(iso) {
  const card = els.daylist.querySelector(`.day-card[data-day="${iso}"]`);
  if (!card) return;
  refreshCardDecorations(card, state.days[iso] || '');
}

/* ============================================================
   Focus tracking
   ============================================================ */

function onFocus(iso, ta) {
  state.focusedDay = iso;
  els.daylist.querySelectorAll('.day-card').forEach((c) => {
    c.classList.toggle('focused', c.dataset.day === iso);
  });
  updateStatusDay();
  updateItemCount();
  updateCursorStatus(ta);
}

function getFocusedTa() {
  if (state.focusedDay) {
    return document.getElementById(`ta-${state.focusedDay}`);
  }
  return document.querySelector('.day-card-textarea');
}

function navigatePanel(dir) {
  const cards = Array.from(els.daylist.querySelectorAll('.day-card'));
  if (!cards.length) return;
  const currentIdx = cards.findIndex((c) => c.dataset.day === state.focusedDay);
  const targetIdx = (currentIdx < 0 ? 0 : currentIdx) + dir;
  if (targetIdx < 0) {
    flashStatusHint('primer panel');
    return;
  }
  if (targetIdx >= cards.length) {
    flashStatusHint('último panel');
    return;
  }
  const targetCard = cards[targetIdx];
  const targetTa = targetCard.querySelector('.day-card-textarea');
  if (!targetTa) return;
  targetTa.focus();
  const end = targetTa.value.length;
  targetTa.setSelectionRange(end, end);
  onFocus(targetTa.dataset.day, targetTa);
  targetCard.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

/* ============================================================
   Input + shortcuts
   ============================================================ */

function onInput(iso, ta) {
  if (maybeExpandSnippet(ta)) {
    state.days[iso] = ta.value;
  } else {
    state.days[iso] = ta.value;
  }
  saveState();
  updateCardBadge(iso);
  updateItemCount();
  updateCursorStatus(ta);
}

function onKeyDown(e, iso, ta) {
  const key = e.key;
  const start = ta.selectionStart;
  const end = ta.selectionEnd;
  const value = ta.value;

  /* ------ Ctrl+S ------ */
  if (e.ctrlKey && !e.shiftKey && !e.altKey && (key === 's' || key === 'S')) {
    e.preventDefault();
    saveState(true);
    return;
  }

  /* ------ Tab / Shift+Tab (indent / dedent) ------ */
  if (key === 'Tab') {
    e.preventDefault();
    const { lineStart, lineEndPos } = getLineBounds(value, start, end);
    const currentLine = value.substring(lineStart, lineEndPos);
    if (e.shiftKey) {
      const m = currentLine.match(/^(\s*(›\s)+)/);
      if (m) {
        const newPrefix = m[1].slice(0, -2);
        const newLine = newPrefix + currentLine.substring(m[0].length);
        replaceRange(ta, lineStart, lineEndPos, newLine);
        const p = lineStart + newLine.length;
        ta.setSelectionRange(p, p);
      } else {
        const m2 = currentLine.match(/^(\s+)/);
        if (m2) {
          const rest = currentLine.substring(Math.min(2, m2[1].length));
          replaceRange(ta, lineStart, lineEndPos, rest);
          const p = lineStart + rest.length;
          ta.setSelectionRange(p, p);
        }
      }
    } else {
      const m = currentLine.match(/^(\s*(›\s)*)/);
      const prefix = m ? m[1] : '';
      const rest = currentLine.substring(prefix.length);
      const newLine = prefix + ITEM_PREFIX + ' ' + rest;
      replaceRange(ta, lineStart, lineEndPos, newLine);
      const p = lineStart + newLine.length;
      ta.setSelectionRange(p, p);
    }
    onInput(iso, ta);
    return;
  }

  /* ------ Enter (auto-prefix continuation / exit empty item) ------ */
  if (key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.altKey) {
    const { lineStart, lineEndPos } = getLineBounds(value, start, end);
    const currentLine = value.substring(lineStart, lineEndPos);
    const isAtEnd = start === lineEndPos && end === lineEndPos;
    const m = currentLine.match(/^(\s*(›\s)*)/);
    const prefix = m ? m[1] : '';
    const rest = currentLine.substring(prefix.length);

    if (prefix && rest.trim() === '' && prefix.trim() !== '') {
      e.preventDefault();
      const removeFrom = lineStart;
      const removeTo = lineEndPos < value.length ? lineEndPos + 1 : lineStart;
      ta.value = value.substring(0, removeFrom) + value.substring(removeTo);
      ta.setSelectionRange(removeFrom, removeFrom);
      onInput(iso, ta);
      return;
    }

    if (prefix && isAtEnd && rest.trim() !== '') {
      e.preventDefault();
      const insert = '\n' + prefix;
      ta.value = value.substring(0, start) + insert + value.substring(end);
      const pos = start + insert.length;
      ta.setSelectionRange(pos, pos);
      onInput(iso, ta);
      return;
    }
  }

  /* ------ Alt+ArrowUp / Alt+ArrowDown (move line within day) ------ */
  if (e.altKey && !e.ctrlKey && !e.shiftKey && (key === 'ArrowUp' || key === 'ArrowDown')) {
    e.preventDefault();
    const { lineStart, lineEndPos } = getLineBounds(value, start, end);
    const dir = key === 'ArrowUp' ? -1 : 1;
    moveLineWithin(ta, dir, lineStart, lineEndPos);
    onInput(iso, ta);
    return;
  }

  /* ------ Shift+Alt+ArrowUp / Shift+Alt+ArrowDown (duplicate line) ------ */
  if (e.altKey && e.shiftKey && !e.ctrlKey && (key === 'ArrowUp' || key === 'ArrowDown')) {
    e.preventDefault();
    const { lineStart, lineEndPos } = getLineBounds(value, start, end);
    const dir = key === 'ArrowUp' ? -1 : 1;
    duplicateLineWithin(ta, dir, lineStart, lineEndPos);
    onInput(iso, ta);
    return;
  }

  /* ------ Ctrl+Shift+K (delete line) ------ */
  if (e.ctrlKey && e.shiftKey && !e.altKey && (key === 'K' || key === 'k')) {
    e.preventDefault();
    const { lineStart, lineEndPos } = getLineBounds(value, start, end);
    deleteLine(ta, lineStart, lineEndPos);
    onInput(iso, ta);
    return;
  }

  /* ------ Ctrl+ArrowUp / Ctrl+ArrowDown (navigate between panels) ------ */
  if (e.ctrlKey && !e.shiftKey && !e.altKey && (key === 'ArrowUp' || key === 'ArrowDown')) {
    e.preventDefault();
    navigatePanel(key === 'ArrowUp' ? -1 : 1);
    return;
  }

  /* ------ Ctrl+Shift+ArrowUp / Ctrl+Shift+ArrowDown (move line to other day) ------ */
  if (e.ctrlKey && e.shiftKey && !e.altKey && (key === 'ArrowUp' || key === 'ArrowDown')) {
    e.preventDefault();
    const dir = key === 'ArrowUp' ? -1 : 1;
    const currentOffset = Number(ta.dataset.offset);
    const targetOffset = currentOffset + dir;
    if (targetOffset < 0 || targetOffset > 7) {
      flashStatusHint(dir === -1 ? 'no hay día anterior' : 'no hay día +8');
      return;
    }
    const { lineStart, lineEndPos } = getLineBounds(value, start, end);
    moveLineToDay(ta, iso, targetOffset, lineStart, lineEndPos);
    return;
  }
}

function getLineBounds(value, start, end) {
  const lineStart = value.lastIndexOf('\n', start - 1) + 1;
  let lineEnd = value.indexOf('\n', end);
  if (lineEnd === -1) lineEnd = value.length;
  return { lineStart, lineEndPos: lineEnd };
}

function replaceRange(ta, from, to, replacement) {
  ta.value = ta.value.substring(0, from) + replacement + ta.value.substring(to);
}

function moveLineWithin(ta, dir, lineStart, lineEndPos) {
  const value = ta.value;
  const currentLine = value.substring(lineStart, lineEndPos);
  if (dir === -1) {
    if (lineStart === 0) return;
    const prevEnd = lineStart;
    const prevStart = value.lastIndexOf('\n', lineStart - 2) + 1;
    const prevLine = value.substring(prevStart, prevEnd - 1);
    ta.value = value.substring(0, prevStart) + currentLine + '\n' + prevLine + value.substring(lineEndPos);
    const p = prevStart + currentLine.length;
    ta.setSelectionRange(p, p);
  } else {
    if (lineEndPos >= value.length) return;
    const nextStart = lineEndPos + 1;
    const nextEndIdx = value.indexOf('\n', nextStart);
    const nextEnd = nextEndIdx === -1 ? value.length : nextEndIdx;
    const nextLine = value.substring(nextStart, nextEnd);
    ta.value = value.substring(0, lineStart) + nextLine + '\n' + currentLine + value.substring(nextEnd);
    const p = lineStart + nextLine.length + 1;
    ta.setSelectionRange(p, p);
  }
}

function duplicateLineWithin(ta, dir, lineStart, lineEndPos) {
  const value = ta.value;
  const currentLine = value.substring(lineStart, lineEndPos);
  if (dir === -1) {
    ta.value = value.substring(0, lineStart) + currentLine + '\n' + value.substring(lineStart);
    const p = lineStart + currentLine.length + 1;
    ta.setSelectionRange(p, p);
  } else {
    ta.value = value.substring(0, lineEndPos) + '\n' + currentLine + value.substring(lineEndPos);
    const p = lineEndPos + currentLine.length + 1;
    ta.setSelectionRange(p, p);
  }
}

function deleteLine(ta, lineStart, lineEndPos) {
  const value = ta.value;
  let from = lineStart;
  let to = lineEndPos;
  if (to < value.length) to++;
  else if (from > 0) from--;
  ta.value = value.substring(0, from) + value.substring(to);
  ta.setSelectionRange(from, from);
}

function moveLineToDay(ta, fromIso, targetOffset, lineStart, lineEndPos) {
  const value = ta.value;
  const currentLine = value.substring(lineStart, lineEndPos);
  let from = lineStart;
  let to = lineEndPos;
  if (to < value.length) to++;
  else if (from > 0) from--;
  const newSource = value.substring(0, from) + value.substring(to);
  ta.value = newSource;
  ta.setSelectionRange(from, from);
  state.days[fromIso] = newSource;

  const targetIso = toIsoDate(dateForOffset(targetOffset));
  const targetTa = document.getElementById(`ta-${targetIso}`);
  const targetContent = state.days[targetIso] || '';
  const needsNewline = targetContent.length > 0 && !targetContent.endsWith('\n');
  const newTarget = targetContent + (needsNewline ? '\n' : '') + currentLine + '\n';
  state.days[targetIso] = newTarget;
  if (targetTa) {
    targetTa.value = newTarget;
    targetTa.focus();
    const pos = newTarget.length - currentLine.length - 1;
    targetTa.setSelectionRange(Math.max(0, pos), Math.max(0, pos));
    onFocus(targetIso, targetTa);
  }

  saveState();
  updateCardBadge(fromIso);
  updateCardBadge(targetIso);
}

function flashStatusHint(text) {
  const el = els.statusHint;
  if (!el) return;
  const prev = el.textContent;
  el.textContent = text;
  el.style.color = '#ffffff';
  el.style.background = '#c72e2e';
  el.style.padding = '0 5px';
  el.style.borderRadius = '2px';
  clearTimeout(flashStatusHint._t);
  flashStatusHint._t = setTimeout(() => {
    el.textContent = prev;
    el.style.color = '';
    el.style.background = '';
    el.style.padding = '';
    el.style.borderRadius = '';
  }, 1500);
}

/* ============================================================
   Utility helpers
   ============================================================ */

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ============================================================
   Snippets
   ============================================================ */

function maybeExpandSnippet(ta) {
  const cursor = ta.selectionStart;
  const before = ta.value.slice(0, cursor);
  if (!before.endsWith(' ')) return false;
  const trimmed = before.replace(/\s+$/, '');
  for (const snip of SNIPPETS) {
    if (trimmed.endsWith(snip.trigger)) {
      const after = ta.value.slice(cursor);
      const replacement = snip.expansion;
      const newBefore = trimmed.slice(0, -snip.trigger.length) + replacement;
      const newPos = newBefore.length;
      ta.value = newBefore + after;
      ta.setSelectionRange(newPos, newPos);
      flashStatusHint(`snippet ${snip.trigger}`);
      return true;
    }
  }
  return false;
}

function insertSnippet(snip) {
  const ta = getFocusedTa();
  if (!ta) { flashStatusHint('enfocá un día primero'); return; }
  const cursor = ta.selectionStart;
  const before = ta.value.slice(0, cursor);
  const after  = ta.value.slice(cursor);
  ta.value = before + snip.expansion + after;
  const pos = cursor + snip.expansion.length;
  ta.setSelectionRange(pos, pos);
  ta.focus();
  onInput(ta.dataset.day, ta);
}

/* ============================================================
   Line-level priority toggle
   ============================================================ */

function toggleLinePriority(level) {
  const ta = getFocusedTa();
  if (!ta) { flashStatusHint('enfocá un día primero'); return; }
  const value = ta.value;
  const start = ta.selectionStart;
  const end   = ta.selectionEnd;
  const { lineStart, lineEndPos } = getLineBounds(value, start, end);
  const currentLine = value.substring(lineStart, lineEndPos);

  let newLine = currentLine;
  if (level === 'high') {
    if (PRIO_HIGH_RE.test(currentLine))      newLine = currentLine.replace(PRIO_HIGH_RE, '› ');
    else if (/^›/.test(currentLine))         newLine = currentLine.replace(/^›\s?/, '›! ');
    else if (PRIO_DONE_RE.test(currentLine)) newLine = currentLine.replace(PRIO_DONE_RE, '›! ');
    else                                     newLine = '›! ' + currentLine;
  } else if (level === 'mid') {
    if (PRIO_MID_RE.test(currentLine))       newLine = currentLine.replace(PRIO_MID_RE, '› ');
    else if (/^›/.test(currentLine))         newLine = currentLine.replace(/^›\s?/, '›? ');
    else if (PRIO_DONE_RE.test(currentLine)) newLine = currentLine.replace(PRIO_DONE_RE, '›? ');
    else                                     newLine = '›? ' + currentLine;
  } else if (level === 'done') {
    if (PRIO_DONE_RE.test(currentLine)) {
      const stripped = currentLine.replace(/^✓\s?/, '› ');
      newLine = stripped === currentLine ? currentLine.replace(/^/, '› ') : stripped;
    } else if (/^›/.test(currentLine))       newLine = currentLine.replace(/^›\s?/, '✓ ');
    else                                     newLine = '✓ ' + currentLine;
  }

  if (newLine !== currentLine) {
    ta.value = value.substring(0, lineStart) + newLine + value.substring(lineEndPos);
    const p = lineStart + newLine.length;
    ta.setSelectionRange(p, p);
    onInput(ta.dataset.day, ta);
  }
}

function markCurrentDayDone() {
  const ta = getFocusedTa();
  if (!ta) return;
  const lines = ta.value.split('\n');
  let changed = 0;
  const newLines = lines.map((line) => {
    const t = line.trim();
    if (!t) return line;
    if (PRIO_DONE_RE.test(t)) return line;
    if (/^›/.test(t)) {
      changed++;
      return line.replace(/^›\s?/, '✓ ');
    }
    return line;
  });
  if (!changed) { flashStatusHint('nada que marcar'); return; }
  ta.value = newLines.join('\n');
  onInput(ta.dataset.day, ta);
  flashStatusHint(`${changed} marcados como hechos`);
}

function clearCurrentDay() {
  const ta = getFocusedTa();
  if (!ta) return;
  if (!ta.value.trim()) { flashStatusHint('día ya vacío'); return; }
  confirmAction('¿Borrar todo el contenido de este día?\nEsta acción no se puede deshacer.', { danger: true })
    .then((ok) => {
      if (!ok) return;
      ta.value = '';
      onInput(ta.dataset.day, ta);
      flashStatusHint('día limpio');
    });
}

/* ============================================================
   Command Palette
   ============================================================ */

const ACTIONS = [];

function registerAction(action) { ACTIONS.push(action); }

function buildActions() {
  OFFSETS.forEach((offset) => {
    const date = dateForOffset(offset);
    const iso = toIsoDate(date);
    const dateStr = formatDateShort(date);
    const wd = formatWeekdayLong(date);
    const labelBase = offset === 0 ? 'Ir a HOY' : `Ir a +${offset} (${wd} ${dateStr})`;
    registerAction({
      id: `goto:${offset}`,
      category: 'Ir',
      label: labelBase,
      keywords: ['ir', 'panel', 'dia', 'day', offset === 0 ? 'hoy' : `+${offset}`],
      handler: () => focusDayByIso(iso)
    });
  });

  registerAction({ id: 'palette:open', category: 'Ver', label: 'Paleta de comandos', shortcut: 'Ctrl+Shift+P', keywords: ['palette', 'comando'], handler: openPalette });
  registerAction({ id: 'search:open',  category: 'Ver', label: 'Buscar en todos los días', shortcut: 'Ctrl+Shift+F', keywords: ['buscar', 'search', 'encontrar'], handler: openSearchPanel });
  registerAction({ id: 'view:kanban',  category: 'Ver', label: 'Ver tablero kanban', keywords: ['kanban', 'tablero', 'trello', 'board'], handler: () => switchView('kanban') });
  registerAction({ id: 'view:matriz',  category: 'Ver', label: 'Ver matriz eisenhower', keywords: ['matriz', 'eisenhower', 'prioridad', 'cuadrantes'], handler: () => switchView('matriz') });
  registerAction({ id: 'view:agenda',  category: 'Ver', label: 'Ver agenda (días)', keywords: ['agenda', 'dias', 'lista'], handler: () => switchView('agenda') });

  registerAction({ id: 'export:json', category: 'Archivo', label: 'Exportar a JSON', keywords: ['exportar', 'descargar', 'backup'], handler: exportData });
  registerAction({ id: 'import:json', category: 'Archivo', label: 'Importar desde JSON', keywords: ['importar', 'restaurar'], handler: () => els.importFile.click() });

  registerAction({ id: 'day:mark-all-done', category: 'Editar', label: 'Marcar todo como hecho (día actual)', keywords: ['marcar', 'hecho', 'done'], handler: markCurrentDayDone });
  registerAction({ id: 'day:clear',          category: 'Editar', label: 'Limpiar día actual',                keywords: ['limpiar', 'borrar', 'clear'], handler: clearCurrentDay });
  registerAction({ id: 'item:prio-high',     category: 'Editar', label: 'Marcar línea actual como urgente (!)', keywords: ['urgente', 'prioridad'], handler: () => toggleLinePriority('high') });
  registerAction({ id: 'item:prio-mid',      category: 'Editar', label: 'Marcar línea actual como dudosa (?)',   keywords: ['dudosa', 'prioridad'],  handler: () => toggleLinePriority('mid') });
  registerAction({ id: 'item:prio-done',     category: 'Editar', label: 'Marcar línea actual como hecha (✓)',    keywords: ['hecha', 'completada'],  handler: () => toggleLinePriority('done') });

  registerAction({ id: 'pwa:install', category: 'App', label: 'Instalar aplicación', keywords: ['instalar', 'pwa'], handler: handleInstall });

  SNIPPETS.forEach((s) => {
    registerAction({
      id: `snippet:${s.trigger}`,
      category: 'Snippet',
      label: `Insertar snippet ${s.trigger}`,
      keywords: [s.trigger.replace(/^\/\//, ''), 'snippet', 'plantilla'],
      handler: () => insertSnippet(s)
    });
  });
}

function focusDayByIso(iso) {
  const ta = document.getElementById(`ta-${iso}`);
  if (!ta) return;
  const card = ta.closest('.day-card');
  if (card && card.scrollIntoView) card.scrollIntoView({ block: 'nearest' });
  ta.focus();
  const end = ta.value.length;
  ta.setSelectionRange(end, end);
  onFocus(iso, ta);
}

function openPalette() {
  if (!els.palette) return;
  els.palette.hidden = false;
  els.paletteInput.value = '';
  renderPaletteResults('');
  setTimeout(() => els.paletteInput.focus(), 0);
}

function closePalette() {
  if (!els.palette) return;
  els.palette.hidden = true;
  els.paletteInput.value = '';
  const ta = getFocusedTa();
  if (ta) ta.focus();
}

function renderPaletteResults(query) {
  const q = (query || '').trim().toLowerCase();
  const matches = ACTIONS.filter((a) => {
    if (!q) return true;
    const hay = [a.label, a.category, ...(a.keywords || [])].join(' ').toLowerCase();
    return q.split(/\s+/).every((tok) => hay.includes(tok));
  });

  if (!matches.length) {
    els.paletteResults.innerHTML = '<li class="palette-empty">Sin coincidencias</li>';
    return;
  }

  const top = matches.slice(0, 60);
  els.paletteResults.innerHTML = top.map((a, i) => `
    <li class="palette-item ${i === 0 ? 'selected' : ''}" data-id="${escapeHtml(a.id)}" role="option">
      <span class="palette-item-cat">${escapeHtml(a.category || '')}</span>
      <span class="palette-item-label">${escapeHtml(a.label)}</span>
      <span class="palette-item-key">${escapeHtml(a.shortcut || '')}</span>
    </li>
  `).join('');

  els.paletteResults.querySelectorAll('.palette-item').forEach((li) => {
    li.addEventListener('click', () => {
      const a = ACTIONS.find((x) => x.id === li.dataset.id);
      if (!a) return;
      closePalette();
      try { a.handler(); }
      catch (e) { console.error('action handler error', e); }
    });
  });
}

function paletteMoveSelection(dir) {
  const items = Array.from(els.paletteResults.querySelectorAll('.palette-item'));
  if (!items.length) return;
  const cur = items.findIndex((i) => i.classList.contains('selected'));
  const next = dir === 1
    ? Math.min(items.length - 1, Math.max(0, cur) + 1)
    : Math.max(0, (cur < 0 ? items.length - 1 : cur) - 1);
  items.forEach((i) => i.classList.remove('selected'));
  items[next].classList.add('selected');
  items[next].scrollIntoView({ block: 'nearest' });
}

/* ============================================================
   Cross-day Search Panel
   ============================================================ */

function openSearchPanel() {
  if (!els.searchPanel) return;
  els.searchPanel.hidden = false;
  els.searchInput.value = '';
  renderSearchResults('');
  setTimeout(() => els.searchInput.focus(), 0);
}

function closeSearchPanel() {
  if (!els.searchPanel) return;
  els.searchPanel.hidden = true;
  els.searchInput.value = '';
  const ta = getFocusedTa();
  if (ta) ta.focus();
}

function renderSearchResults(query) {
  const q = (query || '').trim();
  if (!q) {
    els.searchResults.innerHTML = '<div class="search-empty">Escribí para buscar en los 8 días.</div>';
    return;
  }
  const ql = q.toLowerCase();
  const matches = [];
  const cards = Array.from(els.daylist.querySelectorAll('.day-card'));
  cards.forEach((card) => {
    const ta = card.querySelector('textarea');
    if (!ta) return;
    const value = ta.value;
    if (!value) return;
    const dayLabel = (card.querySelector('.day-card-offset')?.textContent || '') + ' · ' +
                     (card.querySelector('.day-card-date')?.textContent || '');
    const lines = value.split('\n');
    lines.forEach((line, idx) => {
      if (line.toLowerCase().includes(ql)) {
        matches.push({ iso: ta.dataset.day, dayLabel, line, lineIdx: idx });
      }
    });
  });

  if (!matches.length) {
    els.searchResults.innerHTML = '<div class="search-empty">Sin resultados.</div>';
    return;
  }

  els.searchResults.innerHTML = matches.slice(0, 200).map((m) => `
    <div class="search-result" data-iso="${escapeHtml(m.iso)}" data-line="${m.lineIdx}">
      <span class="search-result-day">${escapeHtml(m.dayLabel)}</span>
      <span class="search-result-line">${highlightMatch(m.line, q)}</span>
    </div>
  `).join('');

  els.searchResults.querySelectorAll('.search-result').forEach((el) => {
    el.addEventListener('click', () => {
      const iso = el.dataset.iso;
      const lineIdx = Number(el.dataset.line);
      const ta = document.getElementById(`ta-${iso}`);
      if (!ta) return;
      ta.focus();
      const lines = ta.value.split('\n');
      const lineStart = lines.slice(0, lineIdx).join('\n').length + (lineIdx > 0 ? 1 : 0);
      const matchStart = ta.value.toLowerCase().indexOf(ql, lineStart);
      if (matchStart >= 0) {
        ta.setSelectionRange(matchStart, matchStart + ql.length);
        const lineHeight = parseFloat(getComputedStyle(ta).lineHeight) || 20;
        ta.scrollTop = Math.max(0, lineIdx * lineHeight - ta.clientHeight / 2);
      } else {
        const end = ta.value.length;
        ta.setSelectionRange(end, end);
      }
      onFocus(iso, ta);
      closeSearchPanel();
    });
  });
}

function highlightMatch(text, q) {
  const safe = escapeHtml(text);
  const i = safe.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return safe;
  return safe.slice(0, i) + '<mark>' + safe.slice(i, i + q.length) + '</mark>' + safe.slice(i + q.length);
}

/* ============================================================
   Item line parse / build
   ============================================================ */

function parseItemLine(line) {
  if (!line || !line.trim()) return null;
  const indent = (line.match(/^\s*/) || [''])[0];
  const m = line.slice(indent.length).match(ITEM_LINE_RE);
  if (!m) return null;
  const flags = new Set([m[2], m[3]].filter(Boolean));
  return {
    indent,
    done:      m[1] === '✓',
    wip:       flags.has('~'),
    urgent:    flags.has('!'),
    doubt:     flags.has('?'),
    important: flags.has('*'),
    text:      m[4]
  };
}

function itemState(item) {
  if (!item) return null;
  if (item.done) return 'done';
  if (item.wip)  return 'wip';
  return 'todo';
}

function buildItemLine(item) {
  const marker = item.done ? '✓' : '›';
  const flags = (item.wip ? '~' : '') + (item.urgent ? '!' : '') + (item.doubt ? '?' : '') + (item.important ? '*' : '');
  return `${item.indent}${marker}${flags ? flags + ' ' : ' '}${item.text}`;
}

/* ============================================================
   Kanban view
   ============================================================ */

const KANBAN_COLUMNS = [
  { id: 'todo', label: 'Pendiente',   prefix: '› '  },
  { id: 'wip',  label: 'En progreso', prefix: '›~ ' },
  { id: 'done', label: 'Hecha',       prefix: '✓ '  }
];

let draggedCard = null;

function dayLabelForOffset(offset) {
  return TAB_LABELS[offset] || `+${offset}`;
}

function parseKanbanItems() {
  const items = [];
  OFFSETS.forEach((offset) => {
    const iso = toIsoDate(dateForOffset(offset));
    const content = state.days[iso] || '';
    content.split('\n').forEach((line, lineIndex) => {
      const item = parseItemLine(line);
      if (!item || !item.text.trim()) return;
      items.push({ iso, offset, lineIndex, item, state: itemState(item) });
    });
  });
  return items;
}

function bindDropZone(el, onDropItem) {
  el.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    el.classList.add('drag-over');
  });
  el.addEventListener('dragleave', (e) => {
    if (!el.contains(e.relatedTarget)) el.classList.remove('drag-over');
  });
  el.addEventListener('drop', (e) => {
    e.preventDefault();
    el.classList.remove('drag-over');
    if (!draggedCard) return;
    const { iso, lineIndex } = draggedCard.dataset;
    onDropItem(iso, Number(lineIndex));
    draggedCard = null;
  });
}

function renderKanban() {
  if (!els.kanban) return;
  els.kanban.innerHTML = '';
  const items = parseKanbanItems();

  KANBAN_COLUMNS.forEach((col) => {
    const colItems = items.filter((it) => it.state === col.id);
    const column = document.createElement('section');
    column.className = 'kanban-column';
    column.dataset.state = col.id;

    const header = document.createElement('header');
    header.className = 'kanban-column-header';
    header.innerHTML = `
      <span class="kanban-column-title">${escapeHtml(col.label)}</span>
      <span class="kanban-column-count">${colItems.length}</span>
    `;
    column.appendChild(header);

    const cards = document.createElement('div');
    cards.className = 'kanban-cards';
    colItems.forEach((it) => cards.appendChild(buildItemCard(it)));
    column.appendChild(cards);

    const adder = document.createElement('div');
    adder.className = 'kanban-add';
    adder.innerHTML = `
      <input type="text" class="kanban-add-input" placeholder="+ agregar a ${escapeHtml(col.label.toLowerCase())}…"
             autocomplete="off" spellcheck="false" />
    `;
    const input = adder.querySelector('input');
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && input.value.trim()) {
        addKanbanItem(col, input.value.trim());
        input.value = '';
      } else if (e.key === 'Escape') {
        input.value = '';
        input.blur();
      }
    });
    column.appendChild(adder);

    bindDropZone(column, (iso, lineIndex) => setKanbanItemState(iso, lineIndex, col.id));

    els.kanban.appendChild(column);
  });
}

function buildItemCard(it) {
  const card = document.createElement('article');
  card.className = 'kanban-card';
  card.draggable = true;
  card.dataset.iso = it.iso;
  card.dataset.lineIndex = it.lineIndex;
  card.dataset.state = it.state;

  const flags = [];
  if (it.item.urgent)    flags.push('<span class="prio-badge" data-prio="high" title="urgente">!</span>');
  if (it.item.doubt)     flags.push('<span class="prio-badge" data-prio="mid"  title="dudosa">?</span>');
  if (it.item.wip)       flags.push('<span class="prio-badge" data-prio="wip"  title="en progreso">~</span>');
  if (it.item.important) flags.push('<span class="prio-badge" data-prio="imp"  title="importante">*</span>');

  const tagChips = extractTags(it.item.text).map((t) => {
    const color = TAG_COLOR_MAP[t] || 'blue';
    return `<span class="tag-chip" data-color="${color}">#${escapeHtml(t)}</span>`;
  }).join('');

  card.innerHTML = `
    <div class="kanban-card-top">
      <span class="kanban-card-day" title="${escapeHtml(formatDateLong(isoToDate(it.iso)))}">${escapeHtml(dayLabelForOffset(it.offset))}</span>
      <span class="kanban-card-flags">${flags.join('')}</span>
      <button class="kanban-card-del" title="Borrar ítem" aria-label="Borrar ítem">×</button>
    </div>
    <div class="kanban-card-text">${escapeHtml(it.item.text)}</div>
    ${tagChips ? `<div class="kanban-card-tags">${tagChips}</div>` : ''}
  `;

  card.addEventListener('dragstart', (e) => {
    draggedCard = card;
    card.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `${it.iso}:${it.lineIndex}`);
  });
  card.addEventListener('dragend', () => {
    card.classList.remove('dragging');
    draggedCard = null;
  });

  card.querySelector('.kanban-card-del').addEventListener('click', (e) => {
    e.stopPropagation();
    deleteKanbanItem(it.iso, it.lineIndex, it.item.text);
  });

  card.addEventListener('click', () => openCardInAgenda(it.iso, it.lineIndex));

  return card;
}

function syncDayContent(iso) {
  const ta = document.getElementById(`ta-${iso}`);
  if (ta) ta.value = state.days[iso] || '';
  updateCardBadge(iso);
}

function setKanbanItemState(iso, lineIndex, targetState) {
  const content = state.days[iso];
  if (content == null) return;
  const lines = content.split('\n');
  const item = parseItemLine(lines[lineIndex]);
  if (!item) return;
  if (itemState(item) === targetState) return;

  if (targetState === 'todo')     item.wip = false;
  if (targetState === 'wip')    { item.wip = true;  item.done = false; }
  if (targetState === 'done')   { item.done = true; item.wip = false; }

  lines[lineIndex] = buildItemLine(item);
  state.days[iso] = lines.join('\n');
  saveState();
  syncDayContent(iso);
  renderKanban();
}

function deleteKanbanItem(iso, lineIndex, preview) {
  confirmAction(`¿Borrar este ítem?\n\n${preview.slice(0, 120)}`, { okLabel: 'Borrar', danger: true })
    .then((ok) => {
      if (!ok) return;
      const content = state.days[iso];
      if (content == null) return;
      const lines = content.split('\n');
      lines.splice(lineIndex, 1);
      state.days[iso] = lines.join('\n');
      saveState();
      syncDayContent(iso);
      renderKanban();
    });
}

function addKanbanItem(col, text) {
  const iso = toIsoDate(dateForOffset(0));
  const content = state.days[iso] || '';
  const needsNewline = content.length > 0 && !content.endsWith('\n');
  state.days[iso] = content + (needsNewline ? '\n' : '') + col.prefix + text + '\n';
  saveState();
  syncDayContent(iso);
  renderKanban();
  flashStatusHint(`agregado a ${col.label.toLowerCase()}`);
}

function openCardInAgenda(iso, lineIndex) {
  switchView('agenda');
  const ta = document.getElementById(`ta-${iso}`);
  if (!ta) return;
  ta.focus();
  const lines = ta.value.split('\n');
  const lineStart = lines.slice(0, lineIndex).join('\n').length + (lineIndex > 0 ? 1 : 0);
  const lineEnd = lineStart + (lines[lineIndex] || '').length;
  ta.setSelectionRange(lineStart, lineEnd);
  const lineHeight = parseFloat(getComputedStyle(ta).lineHeight) || 20;
  ta.scrollTop = Math.max(0, lineIndex * lineHeight - ta.clientHeight / 2);
  onFocus(iso, ta);
}

function switchView(view) {
  if (els.daylist) els.daylist.hidden = view !== 'agenda';
  if (els.kanban)  els.kanban.hidden  = view !== 'kanban';
  if (els.matrix)  els.matrix.hidden  = view !== 'matriz';
  document.querySelectorAll('.activity-item[data-view]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });
  try { localStorage.setItem(VIEW_KEY, view); } catch {}
  if (view === 'kanban') renderKanban();
  if (view === 'matriz') renderMatrix();
  if (view === 'agenda' && state.focusedDay) {
    const ta = document.getElementById(`ta-${state.focusedDay}`);
    if (ta) onFocus(state.focusedDay, ta);
  }
}

/* ============================================================
   Eisenhower matrix view
   ============================================================ */

const MATRIX_QUADRANTS = [
  { id: 'q1', label: 'Hacer ya',         hint: 'urgente + importante',      urgent: true,  important: true  },
  { id: 'q2', label: 'Planificar',       hint: 'importante, no urgente',    urgent: false, important: true  },
  { id: 'q3', label: 'Delegar / rápido', hint: 'urgente, no importante',    urgent: true,  important: false },
  { id: 'q4', label: 'Después',          hint: 'ni urgente ni importante',  urgent: false, important: false }
];

function quadrantOf(item) {
  if (item.urgent) return item.important ? 'q1' : 'q3';
  return item.important ? 'q2' : 'q4';
}

function renderMatrix() {
  if (!els.matrix) return;
  els.matrix.innerHTML = '';
  const items = parseKanbanItems().filter((it) => it.state !== 'done');

  MATRIX_QUADRANTS.forEach((q) => {
    const qItems = items.filter((it) => quadrantOf(it.item) === q.id);
    const quad = document.createElement('section');
    quad.className = 'matrix-quad';
    quad.dataset.quad = q.id;

    const header = document.createElement('header');
    header.className = 'matrix-quad-header';
    header.innerHTML = `
      <span class="matrix-quad-title">${escapeHtml(q.label)}</span>
      <span class="matrix-quad-count">${qItems.length}</span>
      <span class="matrix-quad-hint">${escapeHtml(q.hint)}</span>
    `;
    quad.appendChild(header);

    const cards = document.createElement('div');
    cards.className = 'matrix-quad-cards';
    qItems.forEach((it) => cards.appendChild(buildItemCard(it)));
    quad.appendChild(cards);

    bindDropZone(quad, (iso, lineIndex) => setMatrixQuadrant(iso, lineIndex, q));

    els.matrix.appendChild(quad);
  });
}

function setMatrixQuadrant(iso, lineIndex, q) {
  const content = state.days[iso];
  if (content == null) return;
  const lines = content.split('\n');
  const item = parseItemLine(lines[lineIndex]);
  if (!item || item.done) return;
  if (quadrantOf(item) === q.id) return;

  item.urgent = q.urgent;
  item.important = q.important;
  lines[lineIndex] = buildItemLine(item);
  state.days[iso] = lines.join('\n');
  saveState();
  syncDayContent(iso);
  renderMatrix();
}

/* ============================================================
   Confirm dialog
   ============================================================ */

function confirmAction(message, opts = {}) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';
    overlay.innerHTML = `
      <div class="confirm-box" role="dialog" aria-modal="true">
        <div class="confirm-msg">${escapeHtml(message)}</div>
        <div class="confirm-actions">
          <button class="btn" data-choice="no">${escapeHtml(opts.cancelLabel || 'Cancelar')}</button>
          <button class="btn ${opts.danger ? 'btn-primary' : 'btn-primary'}" data-choice="yes">${escapeHtml(opts.okLabel || 'Aceptar')}</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    const box = overlay.querySelector('.confirm-box');
    const yesBtn = overlay.querySelector('[data-choice="yes"]');
    setTimeout(() => yesBtn.focus(), 0);

    const close = (val) => {
      window.removeEventListener('keydown', onKey);
      overlay.remove();
      resolve(val);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); close(false); }
      else if (e.key === 'Enter') { e.preventDefault(); close(true); }
    };
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) return close(false);
      const ch = e.target.dataset && e.target.dataset.choice;
      if (ch === 'yes') return close(true);
      if (ch === 'no')  return close(false);
    });
    window.addEventListener('keydown', onKey);
  });
}

/* ============================================================
   Status bar
   ============================================================ */

function updateItemCount() {
  const ta = getFocusedTa();
  const count = ta ? countItems(ta.value) : 0;
  els.statusItems.textContent = `${count} ítem${count === 1 ? '' : 's'}`;
}

function updateCursorStatus(ta) {
  if (!ta) return;
  const pos = ta.selectionStart;
  const before = ta.value.substring(0, pos);
  const line = before.split('\n').length;
  const lastNl = before.lastIndexOf('\n');
  const col = pos - (lastNl + 1) + 1;
  els.statusCursor.textContent = `Ln ${line}, Col ${col}`;
}

function updateStatusDay() {
  if (!els.statusDay) return;
  const offset = Number(document.querySelector(`.day-card[data-day="${state.focusedDay}"]`)?.dataset.offset || 0);
  els.statusDay.textContent = TAB_LABELS[offset] || `+${offset}`;
}

function updateTitleBar() {
  const today = dateForOffset(0);
  els.todayFullDate.textContent = formatDateLong(today);
}

/* ============================================================
   Locale
   ============================================================ */

function setLocale(locale) {
  if (!SUPPORTED.includes(locale)) return;
  state.locale = locale;
  persistLocale();
  els.locale.value = locale;
  document.documentElement.lang = locale;
  renderDayList();
  updateTitleBar();
  if (state.focusedDay) {
    const ta = document.getElementById(`ta-${state.focusedDay}`);
    if (ta) {
      ta.focus();
      onFocus(state.focusedDay, ta);
    }
  }
}

/* ============================================================
   Export / Import
   ============================================================ */

function exportData() {
  const data = {
    app: 'vsagenda',
    version: 1,
    exportedAt: new Date().toISOString(),
    locale: state.locale,
    days: state.days,
    lastVisit: state.lastVisit
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `vsagenda-${toIsoDate(dateForOffset(0))}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(String(e.target.result));
      if (!data || typeof data !== 'object' || !data.days) throw new Error('Formato inválido (falta days)');
      confirmAction('¿Reemplazar todos los datos actuales con los del archivo?\nEsto no se puede deshacer.', { okLabel: 'Reemplazar', danger: true })
        .then((ok) => {
          if (!ok) return;
          state.days = data.days && typeof data.days === 'object' ? data.days : {};
          state.lastVisit = data.lastVisit || toIsoDate(dateForOffset(0));
          saveState(true);
          renderDayList();
          updateTitleBar();
          const firstTa = document.querySelector('.day-card-textarea');
          if (firstTa) { firstTa.focus(); onFocus(firstTa.dataset.day, firstTa); }
        });
    } catch (err) {
      alert('Error al importar: ' + err.message);
    }
  };
  reader.onerror = () => alert('Error leyendo el archivo');
  reader.readAsText(file);
}

/* ============================================================
   PWA install
   ============================================================ */

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (els.installBtn) els.installBtn.hidden = false;
});

window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  if (els.installBtn) els.installBtn.hidden = true;
});

async function handleInstall() {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  try {
    await deferredPrompt.userChoice;
  } catch (e) {
    console.warn(e);
  }
  deferredPrompt = null;
  if (els.installBtn) els.installBtn.hidden = true;
}

/* ============================================================
   Service worker
   ============================================================ */

function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((err) => console.warn('SW register error', err));
  });
}

/* ============================================================
   Init
   ============================================================ */

function cacheEls() {
  els.daylist = document.getElementById('daylist');
  els.kanban = document.getElementById('kanban');
  els.matrix = document.getElementById('matrix');
  els.todayFullDate = document.getElementById('todayFullDate');
  els.statusSave = document.getElementById('statusSave');
  els.statusItems = document.getElementById('statusItems');
  els.statusCursor = document.getElementById('statusCursor');
  els.statusDay = document.getElementById('statusDay');
  els.statusHint = document.querySelector('.status-hint');
  els.locale = document.getElementById('locale');
  els.exportBtn = document.getElementById('exportBtn');
  els.importBtn = document.getElementById('importBtn');
  els.installBtn = document.getElementById('installBtn');
  els.importFile = document.getElementById('importFile');
  els.palette = document.getElementById('palette');
  els.paletteInput = document.getElementById('paletteInput');
  els.paletteResults = document.getElementById('paletteResults');
  els.paletteBackdrop = document.getElementById('paletteBackdrop');
  els.searchPanel = document.getElementById('searchPanel');
  els.searchInput = document.getElementById('searchInput');
  els.searchResults = document.getElementById('searchResults');
  els.searchClose = document.getElementById('searchClose');
}

function bindUI() {
  els.locale.addEventListener('change', (e) => setLocale(e.target.value));
  els.exportBtn.addEventListener('click', exportData);
  els.importBtn.addEventListener('click', () => els.importFile.click());
  els.importFile.addEventListener('change', (e) => {
    const f = e.target.files && e.target.files[0];
    if (f) importData(f);
    e.target.value = '';
  });
  if (els.installBtn) els.installBtn.addEventListener('click', handleInstall);

  document.querySelectorAll('.menu-item').forEach((btn) => {
    btn.addEventListener('click', () => handleMenuAction(btn.dataset.action));
  });

  document.querySelectorAll('.activity-item').forEach((btn) => {
    if (btn.disabled) return;
    btn.addEventListener('click', () => {
      if (btn.dataset.view) switchView(btn.dataset.view);
    });
  });

  if (els.paletteInput) {
    els.paletteInput.addEventListener('input', () => renderPaletteResults(els.paletteInput.value));
    els.paletteInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape')      { e.preventDefault(); closePalette(); }
      else if (e.key === 'Enter')  { e.preventDefault();
        const sel = els.paletteResults.querySelector('.palette-item.selected');
        if (sel) sel.click();
      }
      else if (e.key === 'ArrowDown') { e.preventDefault(); paletteMoveSelection(1); }
      else if (e.key === 'ArrowUp')   { e.preventDefault(); paletteMoveSelection(-1); }
    });
  }
  if (els.paletteBackdrop) {
    els.paletteBackdrop.addEventListener('click', closePalette);
  }

  if (els.searchInput) {
    els.searchInput.addEventListener('input', () => renderSearchResults(els.searchInput.value));
    els.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.preventDefault(); closeSearchPanel(); }
    });
  }
  if (els.searchClose) {
    els.searchClose.addEventListener('click', closeSearchPanel);
  }

  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();

    if ((e.ctrlKey || e.metaKey) && e.shiftKey && !e.altKey && k === 'p') {
      e.preventDefault();
      if (!els.palette.hidden) closePalette(); else openPalette();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && !e.altKey && k === 'f') {
      e.preventDefault();
      if (!els.searchPanel.hidden) closeSearchPanel(); else openSearchPanel();
      return;
    }

    if (e.key === 'Escape') {
      if (!els.palette.hidden)     { e.preventDefault(); closePalette(); return; }
      if (!els.searchPanel.hidden) { e.preventDefault(); closeSearchPanel(); return; }
    }
  });

  window.addEventListener('beforeunload', () => saveState(true));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') saveState(true);
  });
}

function handleMenuAction(action) {
  switch (action) {
    case 'archive': exportData(); break;
    case 'edit':     openPalette(); break;
    case 'view':     openSearchPanel(); break;
    case 'go':       openPalette(); break;
    case 'help':
      alert([
        'vsagenda — atajos',
        '',
        'Línea:',
        '  Alt+↑/↓         mover línea',
        '  Shift+Alt+↑/↓   duplicar línea',
        '  Tab / Shift+Tab indentar',
        '  Ctrl+Shift+K    borrar línea',
        '  Ctrl+S          guardar',
        '  //bug //idea //todo //done …  snippets (al presionar espacio)',
        '',
        'Paneles:',
        '  Ctrl+↑/↓        panel anterior / siguiente',
        '  Ctrl+Shift+↑/↓  mover línea a otro día',
        '',
        'Overlays:',
        '  Ctrl+Shift+P    paleta de comandos',
        '  Ctrl+Shift+F    buscar en días',
        '  Esc             cerrar overlay',
        '',
        'Tags y prioridades:',
        '  #tag            en cualquier línea (color por categoría)',
        '  ›!  ›?  ›~  ✓   urgente / dudosa / en progreso / hecha',
        '  ›*              importante (matriz eisenhower, ej: ›!* )',
        '  Ícono ▦         vista kanban (arrastrá tarjetas entre columnas)',
        '  Ícono ⊞         matriz eisenhower (arrastrá entre cuadrantes)',
        '',
        'Datos:',
        '  ⬇ exportar JSON   ⬆ importar JSON'
      ].join('\n'));
      break;
  }
}

function init() {
  cacheEls();
  loadLocale();
  loadState();

  const todayIso = toIsoDate(dateForOffset(0));
  if (!state.lastVisit || state.lastVisit < todayIso) {
    rollForward();
  } else {
    state.lastVisit = todayIso;
    saveState(true);
  }

  els.locale.value = state.locale;
  document.documentElement.lang = state.locale;

  buildActions();
  renderDayList();
  updateTitleBar();

  let savedView = 'agenda';
  try { savedView = localStorage.getItem(VIEW_KEY) || 'agenda'; } catch {}
  switchView(['agenda', 'kanban', 'matriz'].includes(savedView) ? savedView : 'agenda');

  const todayTa = document.getElementById(`ta-${todayIso}`);
  if (todayTa && savedView === 'agenda') { todayTa.focus(); onFocus(todayIso, todayTa); }

  bindUI();
  registerSW();
}

document.addEventListener('DOMContentLoaded', init);
