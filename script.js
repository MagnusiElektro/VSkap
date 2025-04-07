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

      // Format dropdown label: "Nybygg_1" → "Nybygg 1 Etg."
      const label = folder.replace(/_/g, ' ') + ' Etg.';
      option.textContent = label;

      select.appendChild(option);
    });
    document.body.appendChild(select);

    select.addEventListener('change', () => loadMap(select.value));
    loadMap(folders[0]); // default to first one
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
