
import { useEffect } from 'react';
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet';
import { MapPin } from 'lucide-react';

import 'leaflet/dist/leaflet.css';

export interface PromotionMapLocation {
  promotionId: number;
  promotionTitle: string;
  businessName: string;
  branchName: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
}

interface PromotionsMapProps {
  locations: PromotionMapLocation[];
  onSelectPromotion: (promotionId: number) => void;
}

function MapAutoFit({
  locations,
}: {
  locations: PromotionMapLocation[];
}) {
  const map = useMap();

  useEffect(() => {
    if (locations.length === 0) return;

    if (locations.length === 1) {
      map.setView(
        [
          locations[0].latitude,
          locations[0].longitude,
        ],
        13,
      );

      return;
    }

    const bounds = locations.map(
      (location) =>
        [
          location.latitude,
          location.longitude,
        ] as [number, number],
    );

    map.fitBounds(bounds, {
      padding: [35, 35],
      maxZoom: 14,
    });
  }, [map, locations]);

  return null;
}

function PromotionsMap({
  locations,
  onSelectPromotion,
}: PromotionsMapProps) {
  const defaultCenter: [number, number] = [
    -19.0196,
    -65.2619,
  ];

  return (
    <div className="relative z-0 isolate overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Promociones en el mapa
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            Selecciona un marcador para ver la oferta.
          </p>
        </div>

        <span className="shrink-0 rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary">
          {locations.length}{' '}
          {locations.length === 1
            ? 'ubicación'
            : 'ubicaciones'}
        </span>
      </div>

      {locations.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
          <MapPin
            size={32}
            className="text-slate-300"
          />

          <p className="mt-3 text-sm font-semibold text-slate-600">
            Aún no hay ubicaciones disponibles
          </p>

          <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
            Las promociones aparecerán aquí cuando
            tengan sucursales con coordenadas válidas.
          </p>
        </div>
      ) : (
        <MapContainer
          center={defaultCenter}
          zoom={6}
          scrollWheelZoom={false}
          className="relative z-0 h-[360px] w-full sm:h-[460px]"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapAutoFit locations={locations} />

          {locations.map((location, index) => (
            <CircleMarker
              key={`${location.promotionId}-${location.branchName}-${index}`}
              center={[
                location.latitude,
                location.longitude,
              ]}
              radius={9}
              pathOptions={{
                color: '#ffffff',
                weight: 2,
                fillColor: '#cc3f35',
                fillOpacity: 0.95,
              }}
            >
              <Popup>
                <div className="min-w-44">
                  <p className="text-xs font-bold uppercase text-slate-500">
                    {location.businessName}
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-900">
                    {location.promotionTitle}
                  </p>

                  <p className="mt-2 text-xs text-slate-600">
                    {location.branchName}
                  </p>

                  <p className="text-xs text-slate-500">
                    {location.address}
                    {location.city
                      ? `, ${location.city}`
                      : ''}
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      onSelectPromotion(
                        location.promotionId,
                      )
                    }
                    className="mt-3 w-full rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white"
                  >
                    Ver promoción
                  </button>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      )}
    </div>
  );
}

export default PromotionsMap;
