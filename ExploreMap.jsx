import { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { categoryIcon } from './CategoryTabs';
import { directionsUrl } from './PlaceCard';

// Custom div markers avoid Leaflet's default-icon asset problem under Vite.
const makeIcon = (category, active) =>
  L.divIcon({
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -26],
    html: `<div class="pin" style="background:${active ? '#d94d27' : '#167065'}"><span>${categoryIcon(category)}</span></div>`,
  });

function Fit({ points, center }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 1) map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 14 });
    else if (points.length === 1) map.setView(points[0], 14);
    else if (center) map.setView(center, 11);
  }, [points, center, map]);
  return null;
}

export default function ExploreMap({ places, center, selectedId, onSelect, height = 480 }) {
  const withCoords = places.filter((p) => p.lat != null && p.lng != null);
  const points = withCoords.map((p) => [p.lat, p.lng]);
  return (
    <div style={{ height }} className="overflow-hidden rounded-2xl border border-sand-200 shadow-card">
      <MapContainer center={center || [20.5937, 78.9629]} zoom={center ? 11 : 4} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Fit points={points} center={center} />
        {withCoords.map((p) => (
          <Marker
            key={p.id}
            position={[p.lat, p.lng]}
            icon={makeIcon(p.category, p.id === selectedId)}
            eventHandlers={{ click: () => onSelect?.(p.id) }}
          >
            <Popup>
              <strong>{p.name}</strong>
              <br />
              {p.cuisine}
              <br />
              <a href={directionsUrl(p)} target="_blank" rel="noreferrer">Get directions</a>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
