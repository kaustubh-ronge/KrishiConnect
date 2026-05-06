"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default Leaflet marker icons (broken in bundlers)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Recenter the map when lat/lng props change
function RecenterMap({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    // Force leaflet to recalculate size to prevent "half-rendered" or "shifted" maps
    map.invalidateSize();
  }, [map]);

  useEffect(() => {
    if (!map) return;
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

// Click handler component
function ClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export default function LeafletMap({ lat, lng, onMapClick }) {
  // Using a stable key for the map container instance
  return (
    <MapContainer
      key="krishi-connect-map"
      center={[lat, lng]}
      zoom={10}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <RecenterMap lat={lat} lng={lng} />
      <ClickHandler onMapClick={onMapClick} />
      <Marker position={[lat, lng]} />
    </MapContainer>
  );
}
