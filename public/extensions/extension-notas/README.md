# Notas — Extensión Chrome

Extensión para trasladar notas desde la sección de Calificaciones de Teams
al acta de parciales de Autogestión  en un clic.

---

## Instalación (modo desarrollador)

1. Descomprimí el `.zip` en una carpeta permanente (no la borrés después)
2. En Chrome: `chrome://extensions/`
3. Activar **"Modo de desarrollador"** (esquina superior derecha)
4. Clic en **"Cargar extensión sin empaquetar"**
5. Seleccionar la carpeta `-notas-ext/`
6. Listo — el ícono aparece en la barra de Chrome

---

## Uso

### 1. Capturar notas en Teams
1. Abrí Teams y navegá a la tarea → pestaña **Calificaciones**
2. Si la lista es larga, **scrolleá hasta el final** para cargar todos los alumnos
3. Hacé clic en el ícono de la extensión
4. Clic en **"Traer notas"**
5. El badge muestra cuántas notas quedaron guardadas

### 2. Cargar en Autogestión
1. Abrí la página del acta de parciales en Autogestión
2. Hacé clic en el ícono de la extensión
3. Clic en **"Pasar notas"**
4. Los selects se completan y colorean (verde = nota, rojo = ausente)
5. Revisás y hacés clic en **"Confirmar"** en el acta

### 3. Instalar Tampermonkey (solo la primera vez si falla)
- El botón **"Instalar Tampermonkey"** lleva directo a la Chrome Web Store
- No es estrictamente necesario ya que la extensión inyecta los scripts directamente

---

## Notas técnicas

- Las notas se guardan en `chrome.storage.local` (persisten entre pestañas)
- El matching usa normalización: sin acentos, sin comas, minúsculas
- Fallback por primer apellido si el nombre completo no matchea
- Notas fuera del rango 1–10 se ignoran
- Notas decimales se redondean al entero más cercano

---

*MgLab — Mauricio González*
