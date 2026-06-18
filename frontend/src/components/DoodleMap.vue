<template>
  <div ref="mapContainer" class="map">
    <div v-if="locationError" class="map-error">{{ locationError }}</div>
    <div v-if="locationReady && !selectedCenter" class="map-hint">
      Tap map to place route
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN as string

const props = defineProps<{
  routeText: string
  distance: number
  lat: number
  lng: number
  locationReady: boolean
  locationError: string
  routeGeoJson: object | null
  selectedCenter: { lat: number; lng: number } | null
}>()

const emit = defineEmits<{
  'select-center': [{ lat: number; lng: number }]
}>()

const cs = getComputedStyle(document.documentElement)
const MARKER_COLOR = cs.getPropertyValue('--color-secondary').trim()
const ROUTE_COLOR = cs.getPropertyValue('--color-primary').trim()

const mapContainer = ref<HTMLDivElement | null>(null)
let map: mapboxgl.Map | null = null
let centerMarker: mapboxgl.Marker | null = null

watch(() => props.locationReady, (ready) => {
  if (ready) initMap(props.lng, props.lat)
})

watch(() => props.routeGeoJson, (geojson) => {
  if (geojson && map) drawRoute(geojson)
})

watch(() => props.selectedCenter, (center) => {
  if (!center || !map) return
  centerMarker?.remove()
  centerMarker = new mapboxgl.Marker({ color: ROUTE_COLOR })
    .setLngLat([center.lng, center.lat])
    .addTo(map)
})

function initMap(lng: number, lat: number) {
  if (!mapContainer.value) return
  map = new mapboxgl.Map({
    container: mapContainer.value,
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [lng, lat],
    zoom: 14,
  })
  new mapboxgl.Marker({ color: MARKER_COLOR })
    .setLngLat([lng, lat])
    .addTo(map)
  map.getCanvas().style.cursor = 'crosshair'
  map.on('click', (e) => {
    emit('select-center', { lat: e.lngLat.lat, lng: e.lngLat.lng })
  })
}

function drawRoute(geojson: object) {
  if (!map) return

  const apply = () => {
    if (map!.getLayer('route')) map!.removeLayer('route')
    if (map!.getSource('route')) map!.removeSource('route')

    map!.addSource('route', { type: 'geojson', data: geojson as any })
    map!.addLayer({
      id: 'route',
      type: 'line',
      source: 'route',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': ROUTE_COLOR, 'line-width': 4, 'line-opacity': 0.85 },
    })
  }

  if (map.loaded()) apply()
  else map.once('load', apply)
}

onUnmounted(() => map?.remove())
</script>

<style scoped>
.map {
  flex: 1;
  width: 100%;
  position: relative;
}

.map-error {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  color: var(--color-secondary);
  font-size: 0.9rem;
}

.map-hint {
  position: absolute;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.9);
  color: var(--color-text);
  font-size: 0.8rem;
  font-weight: 500;
  padding: 0.4rem 0.9rem;
  border-radius: 20px;
  pointer-events: none;
  white-space: nowrap;
}
</style>
