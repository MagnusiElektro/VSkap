[AI_BOOT_START]

This file is a boot prompt for ChatGPT.
Paste it into any new session to reload the full context of the project.
Say "Save progress" any time the structure, code, or goals change — ChatGPT should regenerate this file.

To use this file:
1. Copy everything between [AI_BOOT_START] and [AI_BOOT_END] (including the tags).
2. Paste it into a new ChatGPT session.
3. ChatGPT will then understand your full project context.
4. Say "Save progress" when changes are made to regenerate this file.

---

PROJECT OVERVIEW:
GitHub Pages-hosted interactive floor plan viewer using Leaflet.js.
Each floor lives in `/floorplans/{folder}/` and contains:
- `floorplan.png` – the map image
- `bounds.json` – coordinate bounds
- `annotations.json` – text and arrow annotations

Maps are listed in `maps.json`.
The viewer dynamically loads the image, positions it using bounds, and displays annotations.

Users can zoom/pan. Future UI will allow right-click to add/edit annotations.

Automation script (planned):
- Scans `/floorplans/`
- Updates `maps.json`
- Reads image size to create `bounds.json`
- Creates empty `annotations.json` if missing

---

FOLDER STRUCTURE:
/floorplans/
  /Nybygg 1.Etg/
    floorplan.png
    bounds.json
    annotations.json
/maps.json
/index.html
/script.js
/style.css
/AI_README.md

---

PROJECT FILES:

> index.html:
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

> style.css:
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

> script.js:
const map = L.map('map', {
  crs: L.CRS.Simple,
  minZoom: -2
});

let currentOverlay;
let currentAnnotations = [];
let bounds = [[0, 0], [1000, 1000]]; // default fallback

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
    loadMap(folders[0]); // default to first one
  });

function loadMap(folder) {
  const imageUrl = `floorplans/${folder}/floorplan.png`;
  const boundsUrl = `floorplans/${folder}/bounds.json`;
  const annotationsUrl = `floorplans/${folder}/annotations.json`;

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

> maps.json:
[
  "Nybygg 1.Etg",
  "BT2 2.Etg",
  "Servicebygg"
]

> bounds.json (example):
[[0, 0], [2480, 3508]]

> annotations.json (example):
[
  {
    "id": "cab-001",
    "x": 540,
    "y": 320,
    "text": "Cabinet 001"
  },
  {
    "id": "cab-002",
    "x": 720,
    "y": 180,
    "text": "UPS"
  }
]

---

GPT instructions:
Paste this full `AI_README.md` into a new session to restore full project context.
Say "Save progress" to update this file.

[AI_BOOT_END]
