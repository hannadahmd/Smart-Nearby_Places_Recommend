import { Place, UserLocation, Mood } from '../types';
import { MOOD_CONFIGS } from '../config/moods';

let placesService: google.maps.places.PlacesService | null = null;
let mapInstance: google.maps.Map | null = null;

export const initializePlacesService = (map: google.maps.Map) => {
  mapInstance = map;
  placesService = new google.maps.places.PlacesService(map);
};

const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const searchNearbyPlaces = (
  location: UserLocation,
  mood: Mood
): Promise<Place[]> => {
  return new Promise((resolve, reject) => {
    if (!placesService) {
      reject(new Error('Places service not initialized'));
      return;
    }

    const config = MOOD_CONFIGS[mood];
    const request: google.maps.places.PlaceSearchRequest = {
      location: new google.maps.LatLng(location.lat, location.lng),
      radius: config.radius,
      type: config.types[0],
    };

    placesService.nearbySearch(request, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        const places: Place[] = results
          .filter((place) => place.geometry?.location && place.place_id)
          .map((place) => {
            const placeLat = place.geometry!.location!.lat();
            const placeLng = place.geometry!.location!.lng();
            const distance = calculateDistance(
              location.lat,
              location.lng,
              placeLat,
              placeLng
            );

            return {
              id: place.place_id!,
              name: place.name || 'Unknown',
              vicinity: place.vicinity || '',
              rating: place.rating,
              userRatingsTotal: place.user_ratings_total,
              priceLevel: place.price_level,
              openNow: place.opening_hours?.isOpen?.(),
              geometry: {
                location: {
                  lat: placeLat,
                  lng: placeLng,
                },
              },
              photos: place.photos?.map((photo) => ({
                photo_reference: photo.getUrl({ maxWidth: 400 }),
              })),
              types: place.types || [],
              distance,
            };
          });

        if (mood === 'budget') {
          const filteredPlaces = places.filter(
            (place) =>
              place.priceLevel === undefined ||
              place.priceLevel <= 2
          );
          resolve(filteredPlaces);
        } else {
          resolve(places);
        }
      } else {
        reject(new Error(`Places search failed: ${status}`));
      }
    });
  });
};

export const getUserLocation = (): Promise<UserLocation> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      }
    );
  });
};
