// zero-shot.js
const zeroShotInstructions = `Mantener el prompt-ejemplo tal cual está.
NO agregar ejemplos previos.
La pregunta debe ser directa y clara.
Confiar en que el modelo responderá sin necesidad de ejemplos de entrenamiento.

Ejemplo:
- Base: "Consejos para cuidar un gato"
- Mejorado: "Dame consejos para cuidar un gato"`;

window.zeroShotInstructions = zeroShotInstructions;
