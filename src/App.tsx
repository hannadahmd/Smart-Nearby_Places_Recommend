import { useState, useCallback, useMemo } from 'react';
import { MapPin, Loader2, AlertCircle } from 'lucide-react';
import MoodSelector from './components/MoodSelector';
import PlaceCard from './components/PlaceCard';
import FilterBar from './components/FilterBar';
import Map from './components/Map';
import { useGoogleMaps } from './hooks/useGoogleMaps';
import { getUserLocation, searchNearbyPlaces } from './services/placesService';
import { Mood, Place, UserLocation, SortOption } from './types';

function App() {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('distance');
  const [showOpenOnly, setShowOpenOnly] = useState(false);
  const [minRating, setMinRating] = useState(0);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const { isLoaded: mapsLoaded, error: mapsError } = useGoogleMaps(apiKey);

  const handleGetLocation = async () => {
    setLoading(true);
    setError(null);
    try {
      const location = await getUserLocation();
      setUserLocation(location);
    } catch (err) {
      setError('Failed to get your location. Please enable location services.');
    } finally {
      setLoading(false);
    }
  };

  const handleMoodSelect = async (mood: Mood) => {
    if (!userLocation || !mapLoaded) return;

    setSelectedMood(mood);
    setLoading(true);
    setError(null);
    setSelectedPlace(null);

    try {
      const results = await searchNearbyPlaces(userLocation, mood);
      setPlaces(results);
    } catch (err) {
      setError('Failed to search for places. Please try again.');
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedPlaces = useMemo(() => {
    let filtered = [...places];

    if (showOpenOnly) {
      filtered = filtered.filter((place) => place.openNow === true);
    }

    if (minRating > 0) {
      filtered = filtered.filter(
        (place) => place.rating && place.rating >= minRating
      );
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'distance':
          return (a.distance || 0) - (b.distance || 0);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'popularity':
          return (b.userRatingsTotal || 0) - (a.userRatingsTotal || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [places, sortBy, showOpenOnly, minRating]);

  const handleMapLoad = useCallback(() => {
    setMapLoaded(true);
  }, []);

  if (mapsError || (!apiKey && mapsLoaded)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Configuration Required
          </h2>
          <p className="text-gray-600 mb-4">
            Please add your Google Maps API key to the environment variables.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 text-left">
            <p className="text-sm font-mono text-gray-700">
              VITE_GOOGLE_MAPS_API_KEY=your_api_key
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!mapsLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading Google Maps...</p>
        </div>
      </div>
    );
  }

  if (!userLocation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <MapPin className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Smart Nearby Places
          </h1>
          <p className="text-gray-600 mb-6">
            Discover the perfect places based on your mood and preferences
          </p>
          <button
            onClick={handleGetLocation}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Getting location...
              </>
            ) : (
              <>
                <MapPin className="w-5 h-5" />
                Share My Location
              </>
            )}
          </button>
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Smart Nearby Places
          </h1>
          <p className="text-gray-600">
            Choose your mood and discover amazing places nearby
          </p>
        </header>

        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            What's your mood?
          </h2>
          <MoodSelector
            selectedMood={selectedMood}
            onMoodSelect={handleMoodSelect}
            disabled={loading || !mapLoaded}
          />
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mr-3" />
            <p className="text-gray-600 font-medium">Searching for places...</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {!loading && places.length > 0 && (
          <>
            <div className="mb-6">
              <FilterBar
                sortBy={sortBy}
                onSortChange={setSortBy}
                showOpenOnly={showOpenOnly}
                onOpenOnlyChange={setShowOpenOnly}
                minRating={minRating}
                onMinRatingChange={setMinRating}
                resultsCount={filteredAndSortedPlaces.length}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4 max-h-[calc(100vh-400px)] overflow-y-auto pr-2">
                {filteredAndSortedPlaces.length > 0 ? (
                  filteredAndSortedPlaces.map((place) => (
                    <PlaceCard
                      key={place.id}
                      place={place}
                      onSelect={setSelectedPlace}
                    />
                  ))
                ) : (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                    <p className="text-gray-600">
                      No places match your filters. Try adjusting them.
                    </p>
                  </div>
                )}
              </div>

              <div className="h-[calc(100vh-400px)] sticky top-6">
                <Map
                  userLocation={userLocation}
                  places={filteredAndSortedPlaces}
                  selectedPlace={selectedPlace}
                  onMapLoad={handleMapLoad}
                />
              </div>
            </div>
          </>
        )}

        {!loading && selectedMood && places.length === 0 && !error && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-gray-600">
              No places found for your selected mood. Try a different option.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
