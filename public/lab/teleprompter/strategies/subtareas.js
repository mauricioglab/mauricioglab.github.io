// subtareas.js
const subtareasInstrucciones = `Primero, clasificar la consulta en categorías/subcategorías.
Pedir formato estructurado (JSON) con la clasificación.
Usar esa clasificación para dirigir a instrucciones específicas.
Dividir el proceso en: clasificación → procesamiento específico.

Ejemplo:
- Base: "Consejos para cuidar un gato"
- Mejorado:
Paso 1: Clasifica esta consulta en categoría y subcategoría:
Categorías: [Salud, Alimentación, Comportamiento, Cuidados generales]
Subcategorías: [Prevención, Tratamiento, Nutrición, Higiene, etc.]

Consulta: "Consejos para cuidar un gato"

Proporciona la salida en formato JSON con claves "categoria" y "subcategoria"`;

window.subtareasInstrucciones = subtareasInstrucciones;
