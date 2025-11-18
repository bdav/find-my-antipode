# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Find My Antipode** is an interactive web application that displays two synchronized Google Maps showing a location and its antipode (the point on Earth's surface diametrically opposite). Users can search, pan, and zoom on either map, and the other map automatically updates to show the corresponding antipode.

## Tech Stack

- **TypeScript** with strict mode enabled
- **Vite** for build tooling and dev server
- **Google Maps JavaScript API** via `@googlemaps/js-api-loader`
  - Uses Places API for location search
  - Uses Advanced Marker API for map markers

## Environment Setup

The application requires a Google Maps API key:

1. Copy `.env.example` to `.env`
2. Add your Google Maps API key as `VITE_GOOGLE_MAPS_API_KEY`
3. The Vite environment plugin makes this available via `import.meta.env.VITE_GOOGLE_MAPS_API_KEY`

## Development Commands

```bash
# Install dependencies
npm install

# Start dev server (opens at http://localhost:5173)
npm run dev

# Build for production (runs TypeScript compiler then Vite build)
npm run build

# Preview production build
npm run preview
```

Note: There is no linting or testing setup in this project.

## Architecture

### Single-File Application

The entire application logic lives in `src/index.ts`. The architecture is:

1. **Google Maps API Loader**: Asynchronously loads the Maps API with required libraries (`places`, `marker`)
2. **Map Initialization** (`initMap`): Creates two synchronized Google Maps instances
3. **Event Synchronization**: Bidirectional event listeners keep maps in sync
   - `drag` and `zoom_changed` events on each map trigger updates to the other
   - Events use `fitBounds` to update the opposite map (triggers `bounds_changed` and `zoom_changed` but NOT `drag`)
4. **Search Integration**: SearchBox widget allows users to search for locations on the first map

### Key Functions

- **`computeAntipode(latLng)`**: Calculates the antipode of a point
  - Inverts latitude: `-latitude`
  - Adjusts longitude: `longitude < 0 ? 180 + longitude : longitude - 180`

- **`computeViewportAntipode(viewport)`**: Calculates the antipode of a map viewport (LatLngBounds)
  - Swaps NE and SW corners conceptually (antipode of NE becomes SW of result)
  - Critical for maintaining proper zoom/bounds when syncing maps

- **`updateOtherMap(currentMap, otherMap)`**: Syncs one map to show the antipode view of the other
  - Gets bounds from current map
  - Computes antipode viewport
  - Applies to other map with `fitBounds(viewportAntipode, 0)` (0 padding prevents recursion)

### Map Synchronization Pattern

The app uses a bidirectional sync pattern where changes to either map update the other:
- User interacts with Map 1 → triggers event → `updateOtherMap(map1, map2)` → Map 2 shows antipode
- User interacts with Map 2 → triggers event → `updateOtherMap(map2, map1)` → Map 1 shows antipode

The `fitBounds` calls use 0 padding to prevent infinite event loops between the maps.

### HTML Structure

The `index.html` contains:
- Search input box (`pac-input`) controlled by the SearchBox widget
- Two full-width map containers (`map1`, `map2`), each taking 50vh
- Module script loading `src/index.ts`

## Google Maps API Specifics

The application uses:
- **Map IDs**: Both maps have unique IDs (`map1`, `map2`) required for Advanced Markers
- **AdvancedMarkerElement**: Modern marker API (replaces legacy Marker class)
- **SearchBox**: Part of Places library for location autocomplete
- **ControlPosition.TOP_LEFT**: Where the search box is positioned on map1

## Code Conventions

- TypeScript strict mode with additional linting rules (`noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`)
- Uses type assertions via custom validation functions (e.g., `validateBounds`, `validateLatLng`)
- Comprehensive inline documentation for Google Maps events (see lines 15-39 in index.ts)
