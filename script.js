const map = L.map('map', {
  crs: L.CRS.Simple,
  minZoom: -2
});

let currentOverlay;
let currentAnnotations = [];
let bounds = [[0, 0], [1000, 1000]];

// Room/type lists
const ROOM_LIST = ["101 Datarom", "203 Serverrom", "303 Kantine"];
const TYPE_LIST = ["Underfordeling", "Nettverksfordeling", "Styreskap"];

fetch('maps.json')
  .then(res => res.json())
  .then(folders => {
    const select = document.createElement('select');
    folders.forEach(folder => {
      const option = document.createElement('option');
      option.value = folder;
      option.textContent = folder.replace(/_/g, ' ') + ' Etg.';
      select.appendChild(option);
    });
    document.body.appendChild(select);

    select.addEventListener('change', () => loadMap(select.value));
    loadMap(folders[0]);
  });

function loadMap(name) {
  const timestamp = Date.now();
  const imageUrl = `floorplans/${name}.png?v=${timestamp}`;
  const boundsUrl = `floorplans/${name}.bounds.json?v=${timestamp}`;
  const annotationsUrl = `floorplans/${name}.annotations.json?v=${timestamp}`;

  if (currentOverlay) map.removeLayer(currentOverlay);
  currentAnnotations.forEach(a => map.removeLayer(a));
  currentAnnotations = [];
  map.off('click');

  fetch(boundsUrl)
    .then(res => res.json())
    .then(loadedBounds => {
      bounds = loadedBounds;
      currentOverlay = L.imageOverlay(imageUrl, bounds).addTo(map);
      map.fitBounds(bounds);
      map.setMaxBounds(bounds);

      fetch(annotationsUrl)
        .then(res => res.json())
        .then(annotations => {
          annotations.forEach(cab => addCabinet(cab));
        });

      if (typeof allowEditing !== 'undefined' && allowEditing) {
        map.on('click', onMapClick);
      }
    });
}

function addCabinet({ id, x, y, room, type }) {
  const marker = L.marker([y, x])
    .bindPopup(`<b>ID:</b> ${id}<br><b>Room:</b> ${room}<br><b>Type:</b> ${type}`)
    .addTo(map);

  currentAnnotations.push(marker);
}

function onMapClick(e) {
  const { lat, lng } = e.latlng;

  const form = document.createElement('form');

  form.innerHTML = `
    <label for="id">ID:</label>
    <input name="id" id="id" required />

    <label for="room">Room:</label>
    <select name="room" id="room">
      ${ROOM_LIST.map(r => `<option>${r}</option>`).join('')}
    </select>

    <label for="type">Type:</label>
    <select name="type" id="type">
      ${TYPE_LIST.map(t => `<option>${t}</option>`).join('')}
    </select>

    <button type="submit">Add</button>
  `;

  const popup = L.popup()
    .setLatLng(e.latlng)
    .setContent(form)
    .openOn(map);

  form.addEventListener('submit', event => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    addCabinet({ id: data.id, x: lng, y: lat, room: data.room, type: data.type });
    map.closePopup();
  });
}
