export type Mood = 'work' | 'date' | 'quick-bite' | 'budget';

export interface Place {
  id: string;
  name: string;
  vicinity: string;
  rating?: number;
  userRatingsTotal?: number;
  priceLevel?: number;
  openNow?: boolean;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  photos?: Array<{
    photo_reference: string;
  }>;
  types: string[];
  distance?: number;
}

export interface MoodConfig {
  label: string;
  icon: string;
  color: string;
  types: string[];
  keywords?: string[];
  radius: number;
}

export interface UserLocation {
  lat: number;
  lng: number;
}

export type SortOption = 'distance' | 'rating' | 'popularity';
