// background.js — Recibe notas del extractor y las guarda en storage.local
'use strict';

var api = (typeof browser !== 'undefined') ? browser : chrome;
var STORAGE_KEY = 'autog_notas_pendientes';

api.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message && message.type === 'NOTAS_CAPTURADAS' && message.data) {
        var obj = {};
        obj[STORAGE_KEY] = message.data;
        api.storage.local.set(obj, function() {
            console.log('[Notas BG] Guardadas', message.data.total, 'notas en storage.local');
            sendResponse({ ok: true });
        });
        return true; // mantener canal abierto para respuesta async
    }
});
