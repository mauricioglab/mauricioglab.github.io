// least-to-most.js
const leastToMostInstructions = `Descompón el problema en subproblemas, resuélvelos de menor a mayor.

ESTRUCTURA DEL PROMPT:

FASE 1: "¿Qué subproblemas necesito resolver para [PROBLEMA]?"

FASE 2: Resolver cada subproblema secuencialmente, usando 
las respuestas anteriores como contexto.

PROBLEMA: "Ana llegó antes que Pedro pero después de María.
Carlos llegó después de Pedro. Diana llegó primera.
¿En qué posición llegó Ana?"

FASE 1 - Prompt:
"¿Qué subproblemas necesito resolver?"

Subproblemas:
1. ¿Quién llegó primero? → Diana
2. ¿Relación María-Ana? → María antes que Ana
3. ¿Relación Ana-Pedro? → Ana antes que Pedro
4. ¿Dónde está Carlos? → Después de Pedro

FASE 2 - Construir orden:
Diana → María → Ana → Pedro → Carlos

RESPUESTA: Ana llegó en 3er lugar.`;

window.leastToMostInstructions = leastToMostInstructions;
