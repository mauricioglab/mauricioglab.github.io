// resumir-documentos.js
const resumirDocumentosInstrucciones = `Dividir el documento largo en secciones.
Resumir cada sección individualmente.
Luego resumir los resúmenes.
Aplicar de forma recursiva hasta tener un resumen final dentro del límite de tokens.
Indicar que mantenga coherencia entre secciones.

Ejemplo:
- Base: "Resume este libro sobre cuidado de gatos [libro completo]"
- Mejorado:
Paso 1: Resume la sección 1 (páginas 1-10) en 100 palabras
Paso 2: Resume la sección 2 (páginas 11-20) en 100 palabras
...
Paso N: Combina todos los resúmenes de secciones en un resumen final de 300 palabras`;

window.resumirDocumentosInstrucciones = resumirDocumentosInstrucciones;
