// react.js
const reactInstructions = `Alterna entre Pensamiento, Acción y Observación hasta resolver.

ESTRUCTURA DEL PROMPT:

"[PREGUNTA]

Thought 1: [razonamiento sobre qué hacer]
Action 1: [acción a ejecutar]
Observation 1: [resultado de la acción]

Thought 2: [siguiente razonamiento]
Action 2: [siguiente acción]
Observation 2: [resultado]

... (repetir hasta resolver)

Thought N: Tengo la respuesta.
Action N: Finish[respuesta]"

ACCIONES DISPONIBLES:
- Search[query]: Buscar información
- Lookup[term]: Consultar término
- Calculate[expr]: Calcular
- Finish[answer]: Respuesta final

═══════════════════════════════════════════════════════════════
EJEMPLO 1
═══════════════════════════════════════════════════════════════

PROMPT:
"¿Cuál es el PIB per cápita del país donde se inventó el teléfono?

Thought 1: Necesito saber dónde se inventó el teléfono.
Action 1: Search[inventor del teléfono país]
Observation 1: Bell patentó el teléfono en Estados Unidos, 1876.

Thought 2: Ahora necesito el PIB per cápita de EE.UU.
Action 2: Search[PIB per cápita Estados Unidos]
Observation 2: Aproximadamente $76,000 USD.

Thought 3: Tengo la información completa.
Action 3: Finish[El PIB per cápita de EE.UU. es ~$76,000 USD]"`;

window.reactInstructions = reactInstructions;
