// cargador.js — Se inyecta en la pestaña de Autogestión
// Lee notas del localStorage y llena los <select> del acta de parciales

(function () {
    const STORAGE_KEY = 'autog_notas_pendientes';

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
        console.warn('[Notas] No hay notas guardadas. Capturá desde Teams primero.');
        return { cargadas: 0, noEncontradas: 0, error: 'no_data' };
    }

    const datos = JSON.parse(raw);
    if (!datos?.notas) return { cargadas: 0, noEncontradas: 0, error: 'invalid_data' };

    function norm(s) {
        if (!s) return '';
        return s.trim().toLowerCase()
            .replace(/,/g, ' ')
            .replace(/\s+/g, ' ')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }

    function primerApellido(n) { return n.split(' ')[0]; }

    // Índice de notas: nombre normalizado → valor
    const idx = {};
    datos.notas.forEach(({ nombre, nota }) => { idx[norm(nombre)] = nota; });
    const sinNota = new Set((datos.sinNota || []).map(norm));

    let cargadas = 0, noEncontradas = 0;
    const logNoMatch = [];

    document.querySelectorAll('tbody tr').forEach(fila => {
        const tdNombre = fila.querySelector('td:nth-child(3)');
        const select   = fila.querySelector('select[name^="calif"]');
        if (!tdNombre || !select) return;

        const nombreActa = norm(tdNombre.textContent);
        let nota = undefined;

        // 1) Match exacto normalizado
        if (idx.hasOwnProperty(nombreActa)) {
            nota = idx[nombreActa];
        }

        // 2) Match por primer apellido
        if (nota === undefined) {
            const ap = primerApellido(nombreActa);
            const matchKey = Object.keys(idx).find(k => primerApellido(k) === ap);
            if (matchKey) nota = idx[matchKey];
        }

        // 3) Match invertido (Teams: "Nombre Apellido" vs Acta: "Apellido, Nombre")
        if (nota === undefined) {
            const partes = nombreActa.split(' ').filter(Boolean);
            if (partes.length >= 2) {
                const invertido = partes.slice(1).join(' ') + ' ' + partes[0];
                const matchKey = Object.keys(idx).find(k => k === invertido || k.startsWith(invertido));
                if (matchKey) nota = idx[matchKey];
            }
        }

        // 4) Ausente registrado
        if (nota === undefined && sinNota.has(nombreActa)) {
            nota = 'AUS';
        }

        if (nota === undefined) {
            noEncontradas++;
            logNoMatch.push(tdNombre.textContent.trim());
            return;
        }

        const val = nota === 'AUS' ? '99' : String(nota);
        const opt = select.querySelector(`option[value="${val}"]`);
        if (opt) {
            select.value = val;
            select.dispatchEvent(new Event('change', { bubbles: true }));
            select.style.cssText = nota === 'AUS'
                ? 'background:#3a1010;color:#ff9090;border-color:#8b2020;font-weight:600;'
                : 'background:#0e2e1e;color:#6aff9a;border-color:#1a6b3a;font-weight:600;';
            cargadas++;
        }
    });

    if (logNoMatch.length > 0) {
        console.warn('[Notas] Sin match:', logNoMatch);
    }
    console.log(`[Notas] ✅ ${cargadas} cargadas, ${noEncontradas} sin match`);

    return { cargadas, noEncontradas };
})();
