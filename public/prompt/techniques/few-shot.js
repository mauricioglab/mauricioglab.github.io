// few-shot.js
const fewShotInstructions = `Tomar el prompt-ejemplo.
Agregar 2-3 ejemplos previos del formato esperado.
Los ejemplos deben mostrar el patrón de respuesta deseado.
Mantener consistencia en el formato de los ejemplos.
Incluir todas las categorías/etiquetas posibles en los ejemplos.

Ejemplo:
- Base: "Consejos para cuidar un gato"
- Mejorado: 
Consejos para cuidar un perro: Alimentación balanceada, ejercicio diario, visitas al veterinario
Consejos para cuidar un pez: Cambiar agua semanalmente, temperatura adecuada, alimentación moderada
Consejos para cuidar un gato:`;

window.fewShotInstructions = fewShotInstructions;
