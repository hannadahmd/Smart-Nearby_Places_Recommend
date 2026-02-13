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

// Parse opening hours to check if place is open now
const parseOpeningHours = (openingHours?: string): boolean | undefined => {
    if (!openingHours) return undefined;

    // Handle 24/7
    if (openingHours === '24/7') return true;

    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;

    // Day names for parsing
    const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    // Simple parser for common formats like "Mo-Fr 09:00-17:00" or "Mo-Su 10:00-22:00"
    try {
        const parts = openingHours.split(';').map(p => p.trim());

        for (const part of parts) {
            // Match pattern like "Mo-Fr 09:00-17:00"
            const match = part.match(/([A-Za-z,\-]+)\s+(\d{2}:\d{2})-(\d{2}:\d{2})/);
            if (!match) continue;

            const [, days, openTime, closeTime] = match;

            // Check if current day is in the range
            let dayMatch = false;
            if (days.includes('-')) {
                // Range like Mo-Fr
                const [startDay, endDay] = days.split('-');
                const startIdx = dayNames.indexOf(startDay);
                const endIdx = dayNames.indexOf(endDay);
                const curIdx = currentDay;

                if (startIdx <= endIdx) {
                    dayMatch = curIdx >= startIdx && curIdx <= endIdx;
                } else {
                    // Wraps around week (e.g., Fr-Mo)
                    dayMatch = curIdx >= startIdx || curIdx <= endIdx;
                }
            } else if (days.includes(',')) {
                // List like Mo,We,Fr
                dayMatch = days.split(',').some(d => dayNames.indexOf(d.trim()) === currentDay);
            } else {
                // Single day
                dayMatch = dayNames.indexOf(days) === currentDay;
            }

            if (dayMatch) {
                const [openHour, openMin] = openTime.split(':').map(Number);
                const [closeHour, closeMin] = closeTime.split(':').map(Number);
                const openMinutes = openHour * 60 + openMin;
                const closeMinutes = closeHour * 60 + closeMin;

                if (currentTime >= openMinutes && currentTime <= closeMinutes) {
                    return true;
                }
            }
        }

        return false;
    } catch (e) {
        // If parsing fails, return undefined
        return undefined;
    }
};

// Generate random rating for places (since OSM doesn't have ratings)
const generateRating = (name: string): number => {
    // Use name as seed for consistency
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = ((hash << 5) - hash) + name.charCodeAt(i);
        hash = hash & hash;
    }
    // Generate rating between 3.0 and 5.0
    const rating = 3.0 + (Math.abs(hash) % 21) / 10;
    return Math.round(rating * 10) / 10;
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

                const rating = generateRating(element.tags.name);
                const userRatingsTotal = Math.floor(10 + (Math.abs(rating * 100) % 200));

                return {
                    id: element.id.toString(),
                    name: element.tags.name || 'Unknown',
                    vicinity: element.tags['addr:street']
                        ? `${element.tags['addr:street']}${element.tags['addr:housenumber'] ? ' ' + element.tags['addr:housenumber'] : ''}`
                        : element.tags['addr:city'] || '',
                    rating,
                    userRatingsTotal,
                    priceLevel: undefined,
                    openNow: parseOpeningHours(element.tags.opening_hours),
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
