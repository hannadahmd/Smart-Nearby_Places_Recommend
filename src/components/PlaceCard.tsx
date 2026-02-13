import { MapPin, Star, Clock, DollarSign } from 'lucide-react';
import { Place } from '../types';

interface PlaceCardProps {
  place: Place;
  onSelect: (place: Place) => void;
}

export default function PlaceCard({ place, onSelect }: PlaceCardProps) {
  const getPriceLevel = (level?: number) => {
    if (!level) return null;
    return '$'.repeat(level);
  };

  return (
    <div
      onClick={() => onSelect(place)}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
    >
      {place.photos && place.photos[0] && (
        <img
          src={place.photos[0].photo_reference}
          alt={place.name}
          className="w-full h-40 object-cover rounded-lg mb-3"
        />
      )}

      <h3 className="font-semibold text-lg text-gray-900 mb-2">
        {place.name}
      </h3>

      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2 flex-wrap">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          <span>
            {place.distance
              ? `${place.distance.toFixed(1)} km away`
              : 'Distance unknown'}
          </span>
        </div>

        {place.rating && (
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium text-gray-900">{place.rating.toFixed(1)}</span>
            {place.userRatingsTotal && (
              <span className="text-gray-500">({place.userRatingsTotal})</span>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 flex-wrap">

        {place.priceLevel && (
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <DollarSign className="w-4 h-4" />
            <span>{getPriceLevel(place.priceLevel)}</span>
          </div>
        )}

        {place.openNow !== undefined && (
          <div className="flex items-center gap-1 text-sm">
            <Clock className="w-4 h-4" />
            <span
              className={
                place.openNow ? 'text-green-600 font-medium' : 'text-red-600'
              }
            >
              {place.openNow ? 'Open now' : 'Closed'}
            </span>
          </div>
        )}
      </div>

      {place.vicinity && (
        <p className="text-sm text-gray-500 mt-2">{place.vicinity}</p>
      )}
    </div>
  );
}
