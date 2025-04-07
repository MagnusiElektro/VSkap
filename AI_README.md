[AI_BOOT_START]

This file is a boot prompt for ChatGPT.  
Paste it into a new session to reload the full context of the project.

Say **"Save progress"** any time structure, code, or goals change — ChatGPT will regenerate this file.

---

PROJECT OVERVIEW:
GitHub Pages-hosted interactive floor plan viewer using Leaflet.js.

Each floorplan is represented as flat files in `/floorplans/`:
- `{name}.png` – the map image
- `{name}.bounds.json` – coordinate bounds
- `{name}.annotations.json` – text and arrow annotations

A dropdown is populated from `maps.json` and lets users switch maps.  
The viewer:
- Loads the image via Leaflet image overlay
- Applies bounds for correct zoom/pan
- Loads annotations as markers with popup text

Users can zoom and pan. A UI for right-click annotation editing is planned.

---

NAMING CONVENTION:
User uses simplified base names like `"Nybygg_1"` (no subfolders).  
The dropdown displays these names with `_` replaced by space and `" Etg."` appended (e.g. `"Nybygg 1 Etg."`).

---

AUTOMATION:
- Script: `generateMaps.cjs`
- Scans `/floorplans/`
- For every `{name}.png`, it:
  - Auto-corrects orientation using `.rotate()` via `sharp`
  - Creates `{name}.bounds.json` using image dimensions
  - Creates `{name}.annotations.json` if missing (empty array)
- Cleans up orphaned JSONs if the `.png` is missing
- Updates `maps.json` to list all valid base names, sorted
- Logs and skips unsupported image formats

---

GITHUB ACTION:
File: `.github/workflows/update-maps.yml`

Triggers on push if:
- PNG or JSON files are changed in `floorplans/`
- `generateMaps.cjs` or the workflow file is edited

Steps:
1. Checks out repo
2. Installs Node.js and `sharp`
3. Runs `generateMaps.cjs`
4. Commits any changes to JSON files

Permissions:
- Uses `contents: write` to allow GitHub Actions to push commits

---

DISPLAY STRATEGY:
- `#map` fills the screen using CSS (`width: 100%; height: 100%`)
- Leaflet uses `fitBounds()` to scale the image to the viewport
- `setMaxBounds()` prevents panning outside the image
- No hardcoded `aspect-ratio` — scaling is handled by Leaflet

---

FOLDER STRUCTURE:
/floorplans/
  Nybygg_1.png
  Nybygg_1.bounds.json
  Nybygg_1.annotations.json
/maps.json
/index.html
/script.js
/style.css
/generateMaps.cjs
/package.json
/.github/workflows/update-maps.yml
/AI_README.md

---

KEY FILE UPDATES:

> `script.js` (simplified `loadMap()` section):
```js
map.fitBounds(bounds);
map.setMaxBounds(bounds);
```

> `style.css`:
```css
html, body {
  height: 100%;
  margin: 0;
}
#map {
  width: 100%;
  height: 100%;
}
select {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 1000;
  padding: 4px;
}
```

> `generateMaps.cjs`:
```js
async function getImageDimensions(filePath) {
  try {
    const { width, height } = await sharp(filePath)
      .rotate() // Auto-correct orientation
      .metadata();
    return [[0, 0], [width || 1000, height || 1000]];
  } catch (err) {
    console.warn(`⚠️ Skipping ${filePath} — unsupported format or read error.`);
    return null;
  }
}
```

[AI_BOOT_END]
