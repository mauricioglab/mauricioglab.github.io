// chain-of-thought.js
const chainOfThoughtInstructions = `Tomar el prompt-ejemplo.
Agregar ejemplos que muestren el razonamiento paso a paso.
Cada ejemplo debe incluir los pasos intermedios que llevan a la conclusión.
Explicar el "por qué" detrás de cada paso.
El último ejemplo (la pregunta real) debe seguir el mismo formato.

Ejemplo:
- Base: "Consejos para cuidar un gato"
- Mejorado:
Pregunta: Consejos para cuidar un perro
Razonamiento: Los perros necesitan ejercicio porque son animales activos (15-30 min diarios). Necesitan alimentación balanceada porque su salud depende de nutrientes específicos. Por tanto: ejercicio diario + alimentación balanceada + visitas veterinarias.

Pregunta: Consejos para cuidar un gato
Razonamiento:`;

window.chainOfThoughtInstructions = chainOfThoughtInstructions;
