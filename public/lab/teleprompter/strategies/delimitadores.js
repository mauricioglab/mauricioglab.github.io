// delimitadores.js
const delimitadoresInstrucciones = `Identificar las diferentes partes/secciones del prompt.
Separar claramente cada sección usando delimitadores como: """, ''', \`\`\`, <>, [], ---, ###.
Especificar qué representa cada sección delimitada.
Esto ayuda al modelo a distinguir entre instrucciones, contexto, ejemplos y entrada del usuario.

Ejemplo:
- Base: "Consejos para cuidar un gato"
- Mejorado: 
Analiza la siguiente consulta y proporciona consejos específicos:

"""
Consejos para cuidar un gato
"""

Contexto adicional:
---
Primer gato, vivo en departamento, presupuesto limitado
---`;

window.delimitadoresInstrucciones = delimitadoresInstrucciones;
