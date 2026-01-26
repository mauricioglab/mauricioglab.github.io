// referencia.js
const referenciaInstrucciones = `Incluir documentación, artículos, o información de contexto relevante.
Delimitar claramente el texto de referencia (usar """, ---, etc.).
Instruir al modelo a usar SOLO esa información.
Indicar qué hacer si no encuentra la respuesta en el texto de referencia.
Opcionalmente, pedir que cite las fuentes/secciones usadas.

Ejemplo:
- Base: "Consejos para cuidar un gato"
- Mejorado:
Usa únicamente el siguiente documento para responder. Si no encuentras la información, responde "No tengo información suficiente":

"""
[Aquí iría un artículo sobre cuidado de gatos]
"""

Pregunta: ¿Cuáles son los mejores consejos para cuidar un gato?`;

window.referenciaInstrucciones = referenciaInstrucciones;
