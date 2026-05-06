"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom Icons
const createIcon = (color) => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const icons = {
  buyer: createIcon('blue'),
  seller: createIcon('green'),
  delivery: createIcon('red'),
};

function FitBounds({ markers }) {
  const map = useMap();
  useEffect(() => {
    if (!map || markers.length === 0) return;
    const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
    map.fitBounds(bounds, { padding: [50, 50] });
    map.invalidateSize();
  }, [map, markers]);
  return null;
}

export default function LeafletTrackingMap({ buyerLoc, sellerLoc, deliveryLoc }) {
  const rawMarkers = [
    ...(buyerLoc ? [{ ...buyerLoc, type: 'buyer', label: 'Buyer' }] : []),
    ...(sellerLoc ? [{ ...sellerLoc, type: 'seller', label: 'Seller' }] : []),
    ...(deliveryLoc ? [{ ...deliveryLoc, type: 'delivery', label: 'Delivery Partner' }] : []),
  ];

  // Filter out invalid markers (lat or lng missing or not a number)
  const markers = rawMarkers.filter(m => 
    m.lat !== null && m.lat !== undefined && !isNaN(parseFloat(m.lat)) &&
    m.lng !== null && m.lng !== undefined && !isNaN(parseFloat(m.lng))
  );

  if (markers.length === 0) return <div className="h-full w-full bg-gray-100 flex items-center justify-center">No location data</div>;

  return (
    <MapContainer
      center={[markers[0].lat, markers[0].lng]}
      zoom={13}
      scrollWheelZoom={true}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {markers.map((m, idx) => (
        <Marker key={idx} position={[m.lat, m.lng]} icon={icons[m.type]}>
          <Popup>
            <div className="font-bold">{m.label}</div>
            {m.type === 'delivery' && <div className="text-xs text-gray-500">Live Location</div>}
          </Popup>
        </Marker>
      ))}

      <FitBounds markers={markers} />
    </MapContainer>
  );
}
