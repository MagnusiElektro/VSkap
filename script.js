const map = L.map('map', {
  crs: L.CRS.Simple,
  minZoom: -2
});

const bounds = [[0, 0], [1000, 1000]]; // Adjust to match your image size
const image = L.imageOverlay('floorplan.jpg', bounds).addTo(map);

map.fitBounds(bounds);

map.on('contextmenu', function(e) {
  const id = prompt('Enter cabinet ID:');
  if (!id) return;

  fetch(`data.json`)
    .then(response => response.json())
    .then(data => {
      const item = data.find(entry => entry.id === id);
      if (!item) {
        alert('ID not found in data.');
        return;
      }

      const marker = L.marker(e.latlng).addTo(map);
      marker.bindPopup(`<b>${item.id}</b><br>${item.info}`);
    });
});
