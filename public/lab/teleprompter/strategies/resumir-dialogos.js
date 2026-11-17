// resumir-dialogos.js
const resumirDialogosInstrucciones = `Para conversaciones largas: instruir al modelo a resumir turnos anteriores.
Usar el resumen como contexto para continuar.
Alternativamente: seleccionar dinámicamente partes relevantes de la conversación anterior.
Aplicable cuando el contexto supera el límite de tokens.

Ejemplo:
- Base: [Conversación larga previa] + "Consejos para cuidar un gato"
- Mejorado:
Resumen de conversación anterior:
"""
El usuario tiene un gato de 3 años, vive en departamento, tiene presupuesto limitado, ya discutimos alimentación
"""

Nueva consulta: Dame más consejos para cuidar mi gato (enfócate en aspectos no discutidos previamente)`;

window.resumirDialogosInstrucciones = resumirDialogosInstrucciones;
