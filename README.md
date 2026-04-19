# 🎵 NOIR — Music Player

Player de música estilo Spotify con diseño urbano minimalista. **Negro y morado.**

---

## 🚀 Cómo usarlo en VS Code

### Opción 1 — Live Server (recomendado)
1. Instala la extensión **Live Server** en VS Code
2. Abre la carpeta `musicplayer/` en VS Code
3. Click derecho en `index.html` → **"Open with Live Server"**
4. El player se abre en tu navegador

### Opción 2 — Abrir directamente
1. Abre el archivo `index.html` directamente en tu navegador
   - Nota: algunos navegadores bloquean archivos de audio locales en este modo

---

## 🎵 Cómo agregar tus canciones

### 1. Agrega los archivos de audio
Copia tus archivos `.mp3` a la carpeta:
```
musicplayer/
  assets/
    audio/        ← Aquí van tus .mp3
    covers/       ← Aquí van las imágenes de portada
```

### 2. Edita `js/data.js`
Modifica el arreglo `SONGS` para incluir tus canciones:

```javascript
{
  id: 11,                              // ID único (número)
  title: "Nombre de tu canción",
  artist: "Nombre del artista",
  duration: "3:45",                    // Duración en formato m:ss
  durationSec: 225,                    // Duración en segundos (para simulación)
  src: "assets/audio/mi-cancion.mp3",  // Ruta al archivo de audio
  cover: "assets/covers/mi-cover.jpg", // Ruta a la imagen (opcional)
  emoji: "🎸",                         // Emoji de respaldo si no hay cover
  liked: false,
},
```

---

## ✨ Funciones disponibles

| Función | Descripción |
|---|---|
| ▶ Play / Pause | Controla la reproducción |
| ⏮ / ⏭ Anterior / Siguiente | Cambia de canción |
| 🔀 Aleatorio | Reproduce en orden aleatorio |
| 🔁 Repetir | Repite la canción actual |
| 🔊 Volumen | Slider de volumen + botón de silencio |
| ⏱ Barra de progreso | Click o drag para saltar en la canción |
| ♥ Me gusta | Marca canciones favoritas |
| + Crear playlist | Crea playlists personalizadas |
| + Agregar a playlist | Agrega canciones a tus playlists |
| 🔍 Buscar | Busca por título o artista |
| 🗑 Eliminar playlist | Elimina playlists |

---

## 📁 Estructura del proyecto

```
musicplayer/
├── index.html          → Estructura principal
├── css/
│   └── style.css       → Estilos (tema negro/morado)
├── js/
│   ├── data.js         → Canciones y playlists
│   ├── player.js       → Motor de reproducción
│   ├── ui.js           → Funciones de interfaz
│   └── app.js          → Controlador principal
├── assets/
│   ├── audio/          → Archivos .mp3
│   └── covers/         → Imágenes de portada
└── README.md
```

---

## 🎨 Personalización

Puedes cambiar los colores editando las variables en `css/style.css`:

```css
:root {
  --purple:    #8b5cf6;   /* Color principal morado */
  --purple-dk: #6d28d9;   /* Morado oscuro */
  --purple-lt: #a78bfa;   /* Morado claro */
  --bg-base:   #080808;   /* Fondo negro */
}
```

---

> Las playlists se guardan automáticamente en el `localStorage` del navegador.
