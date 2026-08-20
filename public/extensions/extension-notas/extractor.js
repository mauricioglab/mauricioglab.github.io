// extractor.js v1.6
// Scrollea window, acumula notas, y las envía a la extensión via runtime.sendMessage

(function () {
    const STORAGE_KEY = 'autog_notas_pendientes';

    function limpiar(t) {
        return t ? t.trim().replace(/\s+/g, ' ') : '';
    }

    function parseNota(v) {
        if (v == null || v === '') return null;
        var m = String(v).trim().match(/^(\d+(?:[.,]\d+)?)/);
        if (!m) return null;
        var n = parseFloat(m[1].replace(',', '.'));
        if (n < 1 || n > 10) return null;
        return Math.round(n);
    }

    function capturarVisibles(acumulado) {
        var inputs = document.querySelectorAll('input[data-test="points-input"]');
        inputs.forEach(function(inp) {
            var aria = inp.getAttribute('aria-label') || '';
            var m = aria.match(/\b(?:para|for)\s+(.+)$/i);
            if (m) {
                var nombre = limpiar(m[1]);
                if (nombre.length > 2) {
                    acumulado[nombre] = parseNota(inp.value);
                }
            }
        });
    }

    // Solo ejecutar en el frame que tiene los datos
    // (el frame vacío no tiene inputs, termina rápido sin mandar nada)
    var primeraCaptura = {};
    capturarVisibles(primeraCaptura);
    if (Object.keys(primeraCaptura).length === 0) {
        // Este frame no tiene datos, salir silenciosamente
        return;
    }

    var acumulado = {};
    var scrollTotal = document.body.scrollHeight;
    var PASO   = 500;
    var ESPERA = 400;

    var posiciones = [];
    for (var y = 0; y <= scrollTotal; y += PASO) posiciones.push(y);
    if (posiciones[posiciones.length - 1] < scrollTotal) posiciones.push(scrollTotal);

    var posOriginal = window.scrollY;
    var idx = 0;

    window.scrollTo(0, 0);

    function paso() {
        capturarVisibles(acumulado);
        idx++;

        if (idx < posiciones.length) {
            window.scrollTo(0, posiciones[idx]);
            setTimeout(paso, ESPERA);
        } else {
            // Volver a posición original
            window.scrollTo(0, posOriginal);

            var validos = [];
            var sinNota = [];
            Object.keys(acumulado).forEach(function(nombre) {
                if (acumulado[nombre] !== null) {
                    validos.push({ nombre: nombre, nota: acumulado[nombre] });
                } else {
                    sinNota.push(nombre);
                }
            });

            var data = {
                timestamp: new Date().toISOString(),
                total: validos.length,
                notas: validos,
                sinNota: sinNota
            };

            // Guardar en localStorage de este frame (por si acaso)
            try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch(e) {}

            // Enviar a la extensión via message (cruza el boundary de frames)
            try {
                var api = (typeof browser !== 'undefined') ? browser : chrome;
                api.runtime.sendMessage({ type: 'NOTAS_CAPTURADAS', data: data });
                console.log('[Notas] ✅ Enviado a extensión:', validos.length, 'notas');
            } catch(e) {
                console.warn('[Notas] sendMessage falló:', e.message);
            }

            console.log('[Notas] ✅ Total:', validos.length, '| Sin nota:', sinNota.length);
            if (validos.length > 0) console.table(validos.slice(0, 5));
        }
    }

    setTimeout(paso, 300);
})();
