// popup.js — Notas v1.3 (Chrome + Firefox MV2)
'use strict';

const api = (typeof browser !== 'undefined') ? browser : chrome;
const isFirefox = typeof browser !== 'undefined';

// ── Inyectar archivo en TODOS los frames de la pestaña ───────────────────────
// Los datos de Teams viven en assignments.edu.cloud.microsoft (subframe)
function execFileAllFrames(tabId, file) {
    return new Promise((resolve, reject) => {
        const details = { file, allFrames: true, runAt: 'document_idle' };
        if (isFirefox) {
            browser.tabs.executeScript(tabId, details).then(resolve).catch(reject);
        } else {
            chrome.tabs.executeScript(tabId, details, result => {
                if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
                else resolve(result);
            });
        }
    });
}

// ── Leer localStorage de TODOS los frames, devolver el primero con datos ─────
function readStorageAllFrames(tabId, key) {
    const code = `(function(){
        try { return localStorage.getItem(${JSON.stringify(key)}); }
        catch(e) { return null; }
    })()`;
    return new Promise((resolve, reject) => {
        const details = { code, allFrames: true, runAt: 'document_idle' };
        if (isFirefox) {
            browser.tabs.executeScript(tabId, details).then(results => {
                // results es un array, uno por frame — buscar el que tiene datos
                const found = (results || []).find(r => r && r !== 'null');
                resolve(found || null);
            }).catch(reject);
        } else {
            chrome.tabs.executeScript(tabId, details, results => {
                if (chrome.runtime.lastError) { reject(chrome.runtime.lastError); return; }
                const found = (results || []).find(r => r && r !== 'null');
                resolve(found || null);
            });
        }
    });
}

// ── Escribir en localStorage de TODOS los frames ─────────────────────────────
function writeStorageAllFrames(tabId, key, value) {
    const code = `(function(){
        try { localStorage.setItem(${JSON.stringify(key)}, ${JSON.stringify(value)}); return true; }
        catch(e) { return false; }
    })()`;
    return new Promise((resolve, reject) => {
        const details = { code, allFrames: true, runAt: 'document_idle' };
        if (isFirefox) {
            browser.tabs.executeScript(tabId, details).then(resolve).catch(reject);
        } else {
            chrome.tabs.executeScript(tabId, details, result => {
                if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
                else resolve(result);
            });
        }
    });
}

function storageGet(key) {
    return new Promise(resolve => {
        api.storage.local.get(key, res => resolve(res[key] || null));
    });
}

function storageSet(obj) {
    return new Promise(resolve => api.storage.local.set(obj, resolve));
}

async function getActiveTab() {
    return new Promise(resolve => {
        api.tabs.query({ active: true, currentWindow: true }, tabs => resolve(tabs?.[0]));
    });
}

// ─── Constantes ───────────────────────────────────────────────────────────────
const STORAGE_KEY = 'autog_notas_pendientes';

// ─── Referencias DOM ──────────────────────────────────────────────────────────
const statusDot  = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const ctxChip    = document.getElementById('ctxChip');
const ctxLabel   = document.getElementById('ctxLabel');
const badgeCount = document.getElementById('badgeCount');
const btnExtraer = document.getElementById('btnExtraer');
const btnCargar  = document.getElementById('btnCargar');
const btnInstall = document.getElementById('btnInstall');

// ─── Init ─────────────────────────────────────────────────────────────────────
(async () => {
    const tab = await getActiveTab();
    const url = tab?.url || '';
    renderContext(detectContext(url));
    await renderStorageStatus();
})();

function detectContext(url) {
    if (!url) return 'unknown';
    if (url.includes('teams.microsoft.com') ||
        url.includes('teams.cloud.microsoft') ||
        url.includes('edu.cloud.microsoft')) return 'teams';
    if (url.includes('/autog/')) return 'autog';
    return 'other';
}

function renderContext(ctx) {
    ctxChip.className = 'ctx-chip ' + (ctx === 'unknown' || ctx === 'other' ? '' : ctx);
    ctxLabel.textContent = {
        teams:   '● Teams detectado',
        autog:   '● Autogestión detectada',
        other:   'Abrí Teams o Autogestión',
        unknown: 'Sin pestaña activa',
    }[ctx] || 'Página no reconocida';

    // Botones siempre habilitados — opacidad indica contexto ideal
    btnExtraer.disabled = false;
    btnCargar.disabled  = false;
    btnExtraer.style.opacity = ctx === 'teams' ? '1' : '0.5';
    btnCargar.style.opacity  = ctx === 'autog'  ? '1' : '0.5';
}

async function renderStorageStatus() {
    const data = await storageGet(STORAGE_KEY);
    if (data) {
        const fecha = new Date(data.timestamp).toLocaleString('es-AR', {
            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
        });
        setStatus('ok', `${data.total} notas listas · ${fecha}`);
        badgeCount.textContent = `${data.total} notas`;
        badgeCount.classList.add('visible');
    } else {
        setStatus('warn', 'Sin notas capturadas. Comenzá en Teams.');
        badgeCount.classList.remove('visible');
    }
}

// ─── Botón: Traer notas ───────────────────────────────────────────────────────
btnExtraer.addEventListener('click', async () => {
    const tab = await getActiveTab();
    if (!tab) { setStatus('error', 'No hay pestaña activa.'); return; }

    setLoading(btnExtraer, true);
    setStatus('', 'Buscando notas en todos los frames...');

    try {
        // Inyectar en TODOS los frames (incluyendo assignments.edu.cloud.microsoft)
        await execFileAllFrames(tab.id, 'extractor.js');

        // Esperar scroll: pasos de 500px x 400ms sobre ~3000px = ~3s reales, damos 12s de margen
        setStatus('', 'Scrolleando lista completa...');
        await new Promise(r => setTimeout(r, 12000));

        // Los datos llegan via runtime.sendMessage → background.js → storage.local
        // No necesitamos leer desde el frame, ya están en storage.local
        const data = await storageGet(STORAGE_KEY);

        if (data && data.total > 0) {
            setStatus('ok', `✅ ${data.total} notas capturadas.`);
            badgeCount.textContent = `${data.total} notas`;
            badgeCount.classList.add('visible');
        } else {
            setStatus('error', '⚠️ No se encontraron notas. Asegurate de estar en la pestaña "Calificaciones" de una tarea con las notas visibles.');
        }
    } catch (err) {
        console.error('[Notas] Error extractor:', err);
        setStatus('error', `Error: ${err.message || err}`);
    }

    setLoading(btnExtraer, false);
});

// ─── Botón: Pasar notas ───────────────────────────────────────────────────────
btnCargar.addEventListener('click', async () => {
    const tab = await getActiveTab();
    if (!tab) { setStatus('error', 'No hay pestaña activa.'); return; }

    const stored = await storageGet(STORAGE_KEY);
    if (!stored) {
        setStatus('error', 'No hay notas guardadas. Capturá desde Teams primero.');
        return;
    }

    setLoading(btnCargar, true);
    setStatus('', 'Cargando notas en Autogestión...');

    try {
        // Escribir datos en localStorage de Autogestión (todos los frames por seguridad)
        await writeStorageAllFrames(tab.id, STORAGE_KEY, JSON.stringify(stored));

        // Inyectar cargador
        await execFileAllFrames(tab.id, 'cargador.js');

        await new Promise(r => setTimeout(r, 500));
        setStatus('ok', '✅ Notas cargadas. Revisá los selects y hacé clic en Confirmar.');

    } catch (err) {
        console.error('[Notas] Error cargador:', err);
        setStatus('error', `Error: ${err.message || err}`);
    }

    setLoading(btnCargar, false);
});

// ─── Botón: Debug ─────────────────────────────────────────────────────────────
btnInstall.addEventListener('click', async () => {
    const tab = await getActiveTab();
    const url = tab?.url?.substring(0, 70) || 'ninguna';
    setStatus('', `URL: ${url}`);
    setTimeout(() => renderStorageStatus(), 4000);
});

// ─── UI helpers ───────────────────────────────────────────────────────────────
function setStatus(type, msg) {
    statusDot.className  = 'status-dot '  + (type || '');
    statusText.className = 'status-text ' + (type || '');
    statusText.textContent = msg;
}

function setLoading(btn, on) {
    btn.disabled = on;
    const arrow = btn.querySelector('.btn-arrow');
    if (arrow) arrow.innerHTML = on ? '<span class="spinner"></span>' : '›';
    if (!on) btn.disabled = false;
}
