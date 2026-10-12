import { useEffect } from 'react';

import {
  CircleMarker,
  MapContainer,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet';

import 'leaflet/dist/leaflet.css';

interface LocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (
    latitude: number | null,
    longitude: number | null,
  ) => void;
}

const DEFAULT_CENTER: [number, number] = [
  -19.0333,
  -65.2627,
];

function MapClickHandler({
  onChange,
}: {
  onChange: (latitude: number, longitude: number) => void;
}) {
  useMapEvents({
    click(event) {
      onChange(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
}

function MapCenterUpdater({
  latitude,
  longitude,
}: {
  latitude: number | null;
  longitude: number | null;
}) {
  const map = useMap();

  useEffect(() => {
    const center: [number, number] =
      latitude !== null && longitude !== null
        ? [latitude, longitude]
        : DEFAULT_CENTER;

    map.setView(center, map.getZoom());
    map.invalidateSize();
  }, [map, latitude, longitude]);

  return null;
}

export default function LocationPicker({
  latitude,
  longitude,
  onChange,
}: LocationPickerProps) {
  const hasLocation =
    latitude !== null && longitude !== null;

  const center: [number, number] = hasLocation
    ? [latitude, longitude]
    : DEFAULT_CENTER;

  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-slate-700">
        Ubicación de la sucursal
      </p>

      <p className="mb-3 text-sm text-slate-500">
        Haz clic sobre el mapa para marcar dónde
        se encuentra tu sucursal.
      </p>

      <div className="overflow-hidden rounded-xl border border-slate-200">
        <MapContainer
          center={center}
          zoom={13}
          scrollWheelZoom
          style={{
            height: '320px',
            width: '100%',
          }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapCenterUpdater
            latitude={latitude}
            longitude={longitude}
          />

          <MapClickHandler
            onChange={onChange}
          />

          {hasLocation && (
            <CircleMarker
              center={[latitude, longitude]}
              radius={9}
              pathOptions={{
                color: '#ffffff',
                weight: 3,
                fillColor: '#075e54',
                fillOpacity: 1,
              }}
            />
          )}
        </MapContainer>
      </div>

      {hasLocation ? (
        <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
          <p>
            <strong>Latitud:</strong>{' '}
            {latitude.toFixed(6)}
          </p>

          <p className="mt-1">
            <strong>Longitud:</strong>{' '}
            {longitude.toFixed(6)}
          </p>

          <button
            type="button"
            onClick={() => onChange(null, null)}
            className="mt-2 text-sm font-semibold text-red-600 hover:text-red-700"
          >
            Quitar ubicación
          </button>
        </div>
      ) : (
        <p className="mt-3 text-sm text-amber-700">
          Todavía no has seleccionado una ubicación.
        </p>
      )}
    </div>
  );
}