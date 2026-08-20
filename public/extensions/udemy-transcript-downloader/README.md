# Udemy Transcript Downloader

Extensión para Chrome/Edge/Firefox que descarga transcripciones de cursos de Udemy.

## Instalación

### Chrome / Edge

1. Clona o descarga este repo
2. Abre Chrome/Edge y ve a `chrome://extensions/`
3. Activa "Modo de desarrollador"
4. Click en "Cargar extensión sin empaquetar"
5. Selecciona la carpeta del proyecto

### Firefox

1. Clona o descarga este repo
2. Abre Firefox y ve a `about:debugging#/runtime/this-firefox`
3. Click en "Cargar complemento temporal..."
4. Selecciona el archivo `manifest.json` de la carpeta del proyecto

> **Nota:**Firefox carga la extensión en modo temporal. Para uso persistente, la extensión debe firmarse en [addons.mozilla.org](https://addons.mozilla.org/).

## Uso

Abre cualquier video de Udemy y verás dos botones:

- **Descargar Transcripción** - descarga la transcripción actual
- **Descargar y Siguiente** - descarga y pasa automáticamente a la siguiente clase

Para descargar todo un curso completo, usa el segundo botón y déjalo ir clase por clase.

## Archivos

```
├── manifest.json       - config de la extensión
├── config.js           - selectores HTML (actualiza aquí si Udemy cambia)
├── content.js          - lógica principal
├── styles.css          - estilos
├── popup.html/js       - interfaz del popup
└── icons/              - iconos de la extensión
```

## Configuración

Si Udemy cambia su estructura y deja de funcionar:

1. Abre `config.js`
2. Actualiza los selectores CSS que fallaron
3. Guarda y recarga la extensión

Puedes personalizar los tiempos de espera, formato de archivo, textos, etc. editando `config.js`.

## Troubleshooting

**El botón no aparece:**
- Revisa la consola (F12) para errores
- Asegúrate de estar en una URL `/course/*/learn/lecture/*`
- Verifica que el video tenga transcripción

**La descarga está vacía:**
- Abre manualmente el panel de transcripción primero
- Espera a que cargue completamente
- Intenta de nuevo

**No pasa a la siguiente clase:**
- Revisa que exista el botón "siguiente" en Udemy
- Puede que sea la última clase del curso

**Firefox: la extensión desaparece al reiniciar:**
- Es normal en modo temporal. Reinstala desde `about:debugging` o firma la extensión en AMO.

## Licencia

MIT - usa como quieras