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
User decided to use simplified base names like `"Nybygg_1"` (no subfolders).  
Eventually, the dropdown will show display names like `"Nybygg 1 Etg."`  
(by replacing `_` with a space and appending `"Etg."`).

---

AUTOMATION:
- Script: `generateMaps.cjs`
- Scans `/floorplans/`
- For every `{name}.png`, it:
  - Creates `{name}.bounds.json` using image dimensions via `sharp`
  - Creates `{name}.annotations.json` if missing (empty array)
- Cleans up orphaned JSONs if the `.png` is missing
- Updates `maps.json` to list all valid base names, sorted
- Logs and skips unsupported image formats (not true `.png`)

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

PROJECT FILES:

> `index.html`:
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Interactive Floor Map</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
  <script src="script.js"></script>
</body>
</html>
```

> `style.css`:
```css
html, body, #map {
  height: 100%;
  margin: 0;
}
select {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 1000;
  padding: 4px;
}
```

> `script.js`:
```js
const map = L.map('map', {
  crs: L.CRS.Simple,
  minZoom: -2
});

let currentOverlay;
let currentAnnotations = [];
let bounds = [[0, 0], [1000, 1000]]; // fallback

fetch('maps.json')
  .then(res => res.json())
  .then(folders => {
    const select = document.createElement('select');
    folders.forEach(folder => {
      const option = document.createElement('option');
      option.value = folder;
      option.textContent = folder;
      select.appendChild(option);
    });
    document.body.appendChild(select);

    select.addEventListener('change', () => loadMap(select.value));
    loadMap(folders[0]); // load default
  });

function loadMap(name) {
  const imageUrl = `floorplans/${name}.png`;
  const boundsUrl = `floorplans/${name}.bounds.json`;
  const annotationsUrl = `floorplans/${name}.annotations.json`;

  if (currentOverlay) map.removeLayer(currentOverlay);
  currentAnnotations.forEach(a => map.removeLayer(a));
  currentAnnotations = [];

  fetch(boundsUrl).then(res => res.json()).then(loadedBounds => {
    bounds = loadedBounds;
    currentOverlay = L.imageOverlay(imageUrl, bounds).addTo(map);
    map.fitBounds(bounds);

    fetch(annotationsUrl).then(res => res.json()).then(annotations => {
      annotations.forEach(a => {
        const marker = L.marker([a.y, a.x])
          .bindPopup(`<b>${a.text}</b>`)
          .addTo(map);
        currentAnnotations.push(marker);
      });
    });
  });
}
```

> `generateMaps.cjs`:
```js
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const floorplansDir = path.join(__dirname, 'floorplans');
const mapsFile = path.join(__dirname, 'maps.json');

function getBaseName(file) {
  return path.basename(file, '.png');
}

async function getImageDimensions(filePath) {
  try {
    const metadata = await sharp(filePath).metadata();
    return [[0, 0], [metadata.width, metadata.height]];
  } catch (err) {
    console.warn(`⚠️ Skipping ${filePath} — unsupported format.`);
    return null;
  }
}

(async () => {
  const files = fs.readdirSync(floorplansDir);

  const pngs = files.filter(f => f.endsWith('.png'));
  const baseNames = pngs.map(getBaseName);

  // Clean up orphaned .json files
  const jsons = files.filter(f => f.endsWith('.bounds.json') || f.endsWith('.annotations.json'));
  for (const jsonFile of jsons) {
    const base = jsonFile.replace(/\.(bounds|annotations)\.json$/, '');
    if (!baseNames.includes(base)) {
      console.log(`Deleting orphan JSON: ${jsonFile}`);
      fs.unlinkSync(path.join(floorplansDir, jsonFile));
    }
  }

  // Generate bounds and annotations
  for (const base of baseNames) {
    const pngPath = path.join(floorplansDir, `${base}.png`);
    const boundsPath = path.join(floorplansDir, `${base}.bounds.json`);
    const annotationsPath = path.join(floorplansDir, `${base}.annotations.json`);

    if (!fs.existsSync(boundsPath)) {
      const bounds = await getImageDimensions(pngPath);
      if (bounds) {
        fs.writeFileSync(boundsPath, JSON.stringify(bounds, null, 2));
        console.log(`Created bounds for: ${base}`);
      }
    }

    if (!fs.existsSync(annotationsPath)) {
      fs.writeFileSync(annotationsPath, '[]');
      console.log(`Created empty annotations for: ${base}`);
    }
  }

  // Update maps.json
  baseNames.sort();
  fs.writeFileSync(mapsFile, JSON.stringify(baseNames, null, 2));
  console.log('✅ Updated maps.json');
})();
```

[AI_BOOT_END]
