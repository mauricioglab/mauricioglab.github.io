// self-ask.js
const selfAskInstructions = `Haz que el modelo se pregunte y responda a sí mismo iterativamente.

ESTRUCTURA DEL PROMPT:

"[PREGUNTA PRINCIPAL]

¿Necesito hacer preguntas de seguimiento? Sí.

Pregunta de seguimiento: [pregunta 1]
Respuesta intermedia: [respuesta]

Pregunta de seguimiento: [pregunta 2]
Respuesta intermedia: [respuesta]

Respuesta final: [conclusión]"

PROMPT:
"¿El compositor de 'Für Elise' nació antes o después de la 
Revolución Francesa?

¿Necesito hacer preguntas de seguimiento? Sí.

Pregunta de seguimiento: ¿Quién compuso 'Für Elise'?
Respuesta intermedia: Ludwig van Beethoven.

Pregunta de seguimiento: ¿Cuándo nació Beethoven?
Respuesta intermedia: 16 de diciembre de 1770.

Pregunta de seguimiento: ¿Cuándo comenzó la Revolución Francesa?
Respuesta intermedia: 1789.

Respuesta final: Beethoven nació en 1770, ANTES de la Revolución 
Francesa (1789)."`;

window.selfAskInstructions = selfAskInstructions;
