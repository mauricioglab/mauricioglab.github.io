# Udemy Transcript Downloader

Extension para Chrome/Edge que descarga transcripciones de cursos de Udemy.

## Instalación

1. Clona o descarga este repo
3. Abre Chrome/Edge y ve a `chrome://extensions/`
4. Activa "Modo de desarrollador"
5. Click en "Cargar extensión sin empaquetar"
6. Selecciona la carpeta del proyecto

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

## Licencia

MIT - usa como quieras
