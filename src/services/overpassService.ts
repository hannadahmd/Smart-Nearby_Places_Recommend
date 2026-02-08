import { Place, UserLocation, Mood } from '../types';
import { MOOD_CONFIGS } from '../config/moods';

const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter';

const calculateDistance = (
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
): number => {
    const R = 6371; // Earth's radius in km
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

// Map mood types to OpenStreetMap amenity tags
const getMoodAmenities = (mood: Mood): string[] => {
    switch (mood) {
        case 'work':
            return ['cafe', 'library', 'coworking_space', 'internet_cafe'];
        case 'date':
            return ['restaurant', 'bar', 'pub', 'nightclub', 'theatre', 'cinema'];
        case 'quick-bite':
            return ['fast_food', 'cafe', 'food_court', 'ice_cream'];
        case 'budget':
            return ['fast_food', 'cafe', 'food_court', 'restaurant', 'marketplace'];
        default:
            return ['restaurant'];
    }
};

export const searchNearbyPlaces = async (
    location: UserLocation,
    mood: Mood,
    radiusMultiplier = 1
): Promise<Place[]> => {
    const config = MOOD_CONFIGS[mood];
    const radiusMeters = config.radius * radiusMultiplier;
    const amenities = getMoodAmenities(mood);

    // Build Overpass QL query - each node query needs semicolon
    const amenityFilters = amenities
        .map(a => `node["amenity"="${a}"](around:${radiusMeters},${location.lat},${location.lng});`)
        .join('\n      ');

    // Increased timeout to 45 seconds to prevent 504 errors
    const query = `
    [out:json][timeout:45];
    (
      ${amenityFilters}
    );
    out body;
    >;
    out skel qt;
  `;

    // Helper function for fetching with retry logic
    const fetchWithRetry = async (currentRetry = 0, maxRetries = 2, delay = 2000): Promise<Response> => {
        try {
            const response = await fetch(OVERPASS_API_URL, {
                method: 'POST',
                body: `data=${encodeURIComponent(query)}`,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });

            // Retry on 504 (Gateway Timeout) or 429 (Too Many Requests)
            if ((response.status === 504 || response.status === 429) && currentRetry < maxRetries) {
                console.warn(`Overpass API ${response.status}, retrying... (${currentRetry + 1}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return fetchWithRetry(currentRetry + 1, maxRetries, delay * 2);
            }

            return response;
        } catch (error) {
            if (currentRetry < maxRetries) {
                console.warn(`Network error, retrying... (${currentRetry + 1}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return fetchWithRetry(currentRetry + 1, maxRetries, delay * 2);
            }
            throw error;
        }
    };

    try {
        const response = await fetchWithRetry();

        if (!response.ok) {
            throw new Error(`Overpass API error: ${response.status}`);
        }

        const data = await response.json();

        // If no results and we haven't expanded too much, try larger radius
        if ((!data.elements || data.elements.length === 0) && radiusMultiplier < 4) {
            console.log(`No places found with radius ${radiusMeters}m. Expanding search...`);
            return searchNearbyPlaces(location, mood, radiusMultiplier * 2);
        }

        if (!data.elements || data.elements.length === 0) {
            return [];
        }

        // Transform Overpass data to Place format
        const places: Place[] = data.elements
            .filter((element: any) => element.tags?.name && element.lat && element.lon)
            .map((element: any) => {
                const distance = calculateDistance(
                    location.lat,
                    location.lng,
                    element.lat,
                    element.lon
                );

                return {
                    id: element.id.toString(),
                    name: element.tags.name || 'Unknown',
                    vicinity: element.tags['addr:street']
                        ? `${element.tags['addr:street']}${element.tags['addr:housenumber'] ? ' ' + element.tags['addr:housenumber'] : ''}`
                        : element.tags['addr:city'] || '',
                    rating: undefined, // OSM doesn't have ratings
                    userRatingsTotal: undefined,
                    priceLevel: undefined,
                    openNow: undefined, // Could parse opening_hours if needed
                    geometry: {
                        location: {
                            lat: element.lat,
                            lng: element.lon,
                        },
                    },
                    photos: undefined,
                    types: [element.tags.amenity || 'place'],
                    distance,
                };
            });

        // Sort by distance
        places.sort((a, b) => (a.distance || 0) - (b.distance || 0));

        // Limit results to top 20
        return places.slice(0, 20);
    } catch (error) {
        console.error('Overpass API error:', error);
        throw new Error('Failed to fetch places from OpenStreetMap. Please try again later.');
    }
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
