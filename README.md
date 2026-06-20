# GeoGlyph Go

Turn text or drawings into GPS running routes. Type a word, pick a location, and GeoGlyph Go snaps it to real roads and trails.

## How it works

1. Type text or draw a shape
2. Pick a location and scale
3. The app snaps your path to real roads/trails

## Stack

- **Framework:** Next.js, JavaScript, Vue
- **Map:** Mapbox GL JS
- **Routing:** OpenRouteService
- **Text-to-path:** opentype.js
- **Drawing canvas:** Fabric.js / Konva
- **PWA:** mobile-first progressive web app

## Key challenges

- **Pen-lift problem** — disconnected letter strokes (like the dot on an "i") must connect into one continuous route
- **Road snapping** — converting a geometric path to the nearest traversable surface
- **Scale control** — letting the user decide how big the route is

## Status

Early development.