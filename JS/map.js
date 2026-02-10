// map.js
// Pražská 127/53, Ústí nad Labem – Vaňov
const PLACE = {
   lat: 50.624574166667,
   lng: 14.060566944444,
   zoom: 16,
   label: "Pražská 127/53",
};

const mapEl = document.getElementById("clubMap");
if (!mapEl) {
   throw new Error('Map container "#clubMap" not found.');
}

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

// Base tiles (OSM)
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
   maxZoom: 19,
}).addTo(map);

// Custom pin icon HTML
const markerHtml = `
  <div class="pin" role="img" aria-label="Location pin">
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

// Marker + hover tooltip
const marker = L.marker([PLACE.lat, PLACE.lng], { icon: pinIcon }).addTo(map);

marker.bindTooltip("Zobrazit na mapě", {
   direction: "top",
   offset: [0, -30],
   opacity: 0.95,
   sticky: true,
});

// Label bubble next to pin
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

// Optional: click marker to open map in a new tab (Mapy.cz)
// (Remove if you don't want click behavior)
marker.on("click", () => {
   const url = `https://mapy.cz/zakladni?x=${PLACE.lng}&y=${PLACE.lat}&z=17&source=coor&id=${PLACE.lng}%2C${PLACE.lat}`;
   window.open(url, "_blank", "noopener,noreferrer");
});

// Keep it centered and properly rendered on resize
window.addEventListener("resize", () => map.invalidateSize());

document.querySelector(".map-link").addEventListener("click", () => {
   const url = `https://mapy.cz/zakladni?x=${PLACE.lng}&y=${PLACE.lat}&z=17`;
   window.open(url, "_blank", "noopener,noreferrer");
});
