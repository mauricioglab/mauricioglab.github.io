// tiempo-pensar.js
const tiempoPensarInstrucciones = `Instruir al modelo a generar su propia solución/razonamiento PRIMERO.
Luego comparar o evaluar.
No permitir conclusiones apresuradas.
Estructura: "Primero desarrolla tu solución → Luego compara → Finalmente concluye"

Ejemplo:
- Base: "¿Estos consejos para cuidar gatos son correctos? [lista de consejos]"
- Mejorado:
Primero: Genera tu propia lista de consejos correctos para cuidar gatos
Segundo: Compara tu lista con esta lista proporcionada: [lista]
Tercero: Identifica qué consejos de la lista son correctos, incorrectos o incompletos
Cuarto: Proporciona tu evaluación final`;

window.tiempoPensarInstrucciones = tiempoPensarInstrucciones;
