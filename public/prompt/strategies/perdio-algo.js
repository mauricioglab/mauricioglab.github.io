// perdio-algo.js
const perdioAlgoInstrucciones = `Después de una primera respuesta sobre un documento/texto largo.
Hacer una segunda consulta preguntando: "¿Hay algo más relevante que no hayas incluido?".
Instruir a revisar nuevamente.
Útil para documentos extensos donde el modelo puede omitir información.

Ejemplo:
- Base: "Extrae los consejos principales de este artículo sobre gatos"
- Mejorado (en 2 pasos):
Primera consulta: "Extrae los consejos principales de este artículo sobre cuidado de gatos"

Segunda consulta (seguimiento): "Revisa nuevamente el artículo completo. ¿Hay consejos importantes que no hayas mencionado en tu respuesta anterior? Asegúrate de no omitir información relevante"`;

window.perdioAlgoInstrucciones = perdioAlgoInstrucciones;
