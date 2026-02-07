import { useEffect, useRef } from 'react';
import { Place, UserLocation } from '../types';
import { initializePlacesService } from '../services/placesService';

interface MapProps {
  userLocation: UserLocation | null;
  places: Place[];
  selectedPlace: Place | null;
  onMapLoad: (map: google.maps.Map) => void;
}

export default function Map({
  userLocation,
  places,
  selectedPlace,
  onMapLoad,
}: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  useEffect(() => {
    if (!mapRef.current || !userLocation || mapInstanceRef.current) return;

    const map = new google.maps.Map(mapRef.current, {
      center: { lat: userLocation.lat, lng: userLocation.lng },
      zoom: 14,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }],
        },
      ],
    });

    mapInstanceRef.current = map;
    initializePlacesService(map);
    onMapLoad(map);

    new google.maps.Marker({
      position: { lat: userLocation.lat, lng: userLocation.lng },
      map,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#3B82F6',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
      },
      title: 'Your Location',
    });
  }, [userLocation, onMapLoad]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    places.forEach((place) => {
      const marker = new google.maps.Marker({
        position: {
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng,
        },
        map: mapInstanceRef.current,
        title: place.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 6,
          fillColor: '#EF4444',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });

      markersRef.current.push(marker);
    });
  }, [places]);

  useEffect(() => {
    if (!mapInstanceRef.current || !selectedPlace) return;

    mapInstanceRef.current.panTo({
      lat: selectedPlace.geometry.location.lat,
      lng: selectedPlace.geometry.location.lng,
    });
    mapInstanceRef.current.setZoom(16);
  }, [selectedPlace]);

  return (
    <div
      ref={mapRef}
      className="w-full h-full rounded-xl overflow-hidden shadow-lg"
    />
  );
}
