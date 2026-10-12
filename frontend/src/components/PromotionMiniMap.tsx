import { useEffect } from 'react';
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface Branch {
  id: number;
  name: string;
  address: string;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface PromotionBranch {
  branchId: number;
  branch: Branch;
}

interface PromotionMiniMapProps {
  branches?: PromotionBranch[];
}

function FitMiniMapBounds({
  locations,
}: {
  locations: { latitude: number; longitude: number }[];
}) {
  const map = useMap();

  useEffect(() => {
    if (locations.length === 0) return;

    if (locations.length === 1) {
      map.setView(
        [locations[0].latitude, locations[0].longitude],
        13,
      );
      return;
    }

    map.fitBounds(
      locations.map(
        ({ latitude, longitude }) =>
          [latitude, longitude] as [number, number],
      ),
      { padding: [15, 15], maxZoom: 13 },
    );
  }, [map, locations]);

  return null;
}

export default function PromotionMiniMap({
  branches = [],
}: PromotionMiniMapProps) {
  const locations = branches.flatMap(({ branch }) => {
    const { latitude, longitude } = branch;

    if (
      latitude == null ||
      longitude == null ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return [];
    }

    return [{
      id: branch.id,
      name: branch.name,
      address: branch.address,
      city: branch.city,
      latitude,
      longitude,
    }];
  });

  if (locations.length === 0) {
    return (
      <div className="flex h-36 items-center justify-center rounded-xl bg-slate-100 text-sm text-slate-500">
        Ubicación no disponible
      </div>
    );
  }

  return (
    <div className="relative h-36 overflow-hidden rounded-xl border border-slate-200">
      <MapContainer
        center={[locations[0].latitude, locations[0].longitude]}
        zoom={13}
        className="h-full w-full"
        scrollWheelZoom={false}
        dragging={false}
        zoomControl={false}
        doubleClickZoom={false}
        touchZoom={false}
        keyboard={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitMiniMapBounds locations={locations} />

        {locations.map((location) => (
          <CircleMarker
            key={location.id}
            center={[location.latitude, location.longitude]}
            radius={7}
            pathOptions={{
              color: '#ffffff',
              weight: 2,
              fillColor: '#cc3f35',
              fillOpacity: 1,
            }}
          >
            <Popup>
              <strong>{location.name}</strong>
              <br />
              {location.address}
              {location.city ? `, ${location.city}` : ''}
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      <span className="pointer-events-none absolute bottom-2 right-2 z-[1000] rounded-lg bg-white/95 px-2 py-1 text-xs font-semibold text-slate-700 shadow">
        <span className="mr-1">📍</span>
        {locations.length === 1
          ? 'Ver ubicación'
          : `${locations.length} sucursales`}
      </span>
    </div>
  );
}