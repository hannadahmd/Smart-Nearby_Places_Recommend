# Smart Nearby Places Recommender

A location-based recommendation app that suggests nearby places based on your mood, using Google Maps and Places APIs with dynamic filtering and real-time user preferences.

## Features

- **Mood-Based Recommendations**: Choose from Work & Study, Date Night, Quick Bite, or Budget Friendly
- **Real-Time Location**: Automatically detects your current location
- **Interactive Map**: Visualize all recommended places on an embedded Google Map
- **Smart Filtering**: Filter by open hours, minimum rating, and sort by distance, rating, or popularity
- **Detailed Place Info**: View ratings, distance, price level, and current open status
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

- React 18 with TypeScript
- Google Maps JavaScript API
- Google Places API
- Tailwind CSS for styling
- Lucide React for icons
- Vite for build tooling

## Setup Instructions

### 1. Get a Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Maps JavaScript API
   - Places API
4. Create credentials (API key)
5. Restrict your API key (recommended for production)

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Start Development Server

The development server starts automatically.

## How It Works

1. **Location Access**: The app requests your browser's geolocation
2. **Mood Selection**: Choose one of four moods that match your needs
3. **Places Search**: The app queries Google Places API for relevant locations
4. **Smart Filtering**: Apply filters for ratings, open hours, and sorting preferences
5. **Map Interaction**: Click on any place card to focus it on the map

## Project Structure

```
src/
├── components/          # React components
│   ├── MoodSelector.tsx    # Mood selection UI
│   ├── PlaceCard.tsx       # Individual place display
│   ├── FilterBar.tsx       # Filter and sort controls
│   └── Map.tsx             # Google Maps integration
├── services/            # API integration
│   └── placesService.ts    # Google Places API wrapper
├── config/              # Configuration files
│   └── moods.ts            # Mood definitions
├── hooks/               # Custom React hooks
│   └── useGoogleMaps.ts    # Google Maps loader
├── types.ts             # TypeScript definitions
└── App.tsx              # Main application component
```

## Mood Categories

- **Work & Study**: Coffee shops, libraries, coworking spaces (2km radius)
- **Date Night**: Restaurants, bars, romantic venues (5km radius)
- **Quick Bite**: Fast food, takeout, casual dining (1.5km radius)
- **Budget Friendly**: Affordable dining options with price filtering (3km radius)

## Resume Line

Built a location-based recommendation app using Maps & Places APIs with dynamic filtering and real-time user preferences.

## Production Deployment

The app is production-ready and can be deployed to any static hosting service:

```bash
npm run build
```

The built files will be in the `dist/` directory.
