import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon, LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Place, UserLocation } from '../types';

interface MapProps {
  userLocation: UserLocation | null;
  places: Place[];
  selectedPlace: Place | null;
  onMapLoad: () => void;
}

// Fix for default marker icons in Leaflet with webpack
const userIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const placeIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to handle map updates
function MapUpdater({ selectedPlace }: { selectedPlace: Place | null }) {
  const map = useMap();

  useEffect(() => {
    if (selectedPlace) {
      map.flyTo(
        [selectedPlace.geometry.location.lat, selectedPlace.geometry.location.lng],
        16,
        { duration: 1 }
      );
    }
  }, [selectedPlace, map]);

  return null;
}

export default function Map({
  userLocation,
  places,
  selectedPlace,
  onMapLoad,
}: MapProps) {
  useEffect(() => {
    // Notify parent that map is loaded
    const timer = setTimeout(() => {
      onMapLoad();
    }, 500);
    return () => clearTimeout(timer);
  }, [onMapLoad]);

  if (!userLocation) {
    return (
      <div className="w-full h-full rounded-xl overflow-hidden shadow-lg bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Loading map...</p>
      </div>
    );
  }

  const center: LatLngExpression = [userLocation.lat, userLocation.lng];
  const mapKey = `map-${userLocation.lat}-${userLocation.lng}`;

  return (
    <MapContainer
      key={mapKey}
      center={center}
      zoom={14}
      className="w-full h-full rounded-xl overflow-hidden shadow-lg"
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* User location marker */}
      <Marker position={center} icon={userIcon}>
        <Popup>Your Location</Popup>
      </Marker>

      {/* Place markers */}
      {places.map((place) => (
        <Marker
          key={place.id}
          position={[place.geometry.location.lat, place.geometry.location.lng]}
          icon={placeIcon}
        >
          <Popup>
            <div className="text-sm">
              <strong>{place.name}</strong>
              {place.vicinity && <p className="text-xs text-gray-600">{place.vicinity}</p>}
              {place.distance && (
                <p className="text-xs text-gray-500 mt-1">
                  {place.distance.toFixed(2)} km away
                </p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}

      <MapUpdater selectedPlace={selectedPlace} />
    </MapContainer>
  );
}
