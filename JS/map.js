// Pražská 127/53, Ústí nad Labem – Vaňov
// Source coords: Podnikatel.cz (WGS84)
// lat: 50.624574166667, lon: 14.060566944444
const PLACE = {
   lat: 50.624574166667,
   lng: 14.060566944444,
   zoom: 16,
   label: "Pražská 127/53",
};

const map = L.map("clubMap", {
   zoomControl: false,
   attributionControl: false,
   scrollWheelZoom: false,
   dragging: true,
   doubleClickZoom: false,
   boxZoom: false,
   keyboard: false,
   tap: false,
}).setView([PLACE.lat, PLACE.lng], PLACE.zoom);

// OSM tiles
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
   maxZoom: 19,
}).addTo(map);

// Custom pin
const markerHtml = `
  <div class="pin">
    <div class="pin-head">
      <span class="pin-icon">⌂</span>
    </div>
    <div class="pin-tip"></div>
  </div>
`;

const pinIcon = L.divIcon({
   className: "pin-wrap",
   html: markerHtml,
   iconSize: [46, 46],
   iconAnchor: [23, 44],
});

L.marker([PLACE.lat, PLACE.lng], { icon: pinIcon }).addTo(map);

// Label bubble
const labelHtml = `<div class="map-label"><b>${PLACE.label}</b></div>`;
const labelIcon = L.divIcon({
   className: "label-wrap",
   html: labelHtml,
   iconSize: [220, 40],
   iconAnchor: [-10, 20], // pushes label to the right of the pin
});

L.marker([PLACE.lat, PLACE.lng], { icon: labelIcon, interactive: false }).addTo(
   map,
);

// Keep centered after resize
window.addEventListener("resize", () => map.invalidateSize());
