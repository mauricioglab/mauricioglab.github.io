// zero-chain-of-thought.js
const zeroChainOfThoughtInstructions = `Tomar el prompt-ejemplo.
Agregar al final la frase: "Piénsalo paso a paso" o "Pensemos paso a paso".
NO agregar ejemplos previos.
El comando mágico debe ir al final del prompt.

Ejemplo:
- Base: "Consejos para cuidar un gato"
- Mejorado: "Consejos para cuidar un gato. Piénsalo paso a paso"`;

window.zeroChainOfThoughtInstructions = zeroChainOfThoughtInstructions;
