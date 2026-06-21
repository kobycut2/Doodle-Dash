<template>
  <div ref="mapContainer" class="map">
    <div v-if="!locationReady && !locationError" class="loader"></div>
    <div v-if="locationError" class="map-error">
      <div class="map-error__icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="36" height="36">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <p class="map-error__title">Location access denied</p>
      <p class="map-error__body">Enable location permissions in your browser settings and reload the page to use your current location.</p>
    </div>
    <div v-if="actualDistanceMiles" class="distance-controls">
      <div class="unit-toggle">
        <button :class="{ 'unit-toggle--active': !useKm }" @click="useKm = false">mi</button>
        <button :class="{ 'unit-toggle--active': useKm }" @click="useKm = true">km</button>
      </div>
      <div class="distance-badge">
        <span class="distance-value">{{ displayedDistance }}</span>
        <span class="distance-unit">{{ useKm ? 'km' : 'mi' }}</span>
      </div>
    </div>
    <button
      v-if="drawingActive && drawnStrokes.length > 0"
      class="map-undo-btn"
      title="Undo last stroke"
      @click="undoStroke"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="17" height="17">
        <path d="M3 7v6h6"/><path d="M3 13C5 7 10 4 16 6s8 8 5 13"/>
      </svg>
    </button>
    <button
      v-if="locationReady && showDrawBtn"
      class="map-draw-btn"
      :class="{ 'map-draw-btn--active': drawingActive }"
      :title="drawingActive ? 'Stop drawing' : 'Draw on map'"
      @click="toggleDrawing"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="17" height="17">
        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
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
  actualDistanceMiles: number | null
  showDrawBtn?: boolean
}>()

const emit = defineEmits<{
  'select-center': [{ lat: number; lng: number }]
  'drawing-change': [boolean]
  'strokes-change': [boolean]
  'clear-center': []
}>()

const cs = getComputedStyle(document.documentElement)
const MARKER_COLOR = cs.getPropertyValue('--color-secondary').trim()
const ROUTE_COLOR = cs.getPropertyValue('--color-primary').trim()

const mapContainer = ref<HTMLDivElement | null>(null)
let map: mapboxgl.Map | null = null
let locationMarker: mapboxgl.Marker | null = null
let centerMarker: mapboxgl.Marker | null = null

// Drawing state
const useKm = ref(false)
const displayedDistance = computed(() => {
  if (!props.actualDistanceMiles) return ''
  if (useKm.value) return Math.round(props.actualDistanceMiles * 1.60934 * 10) / 10
  return props.actualDistanceMiles
})

const drawingActive = ref(false)
const drawnStrokes = ref<[number, number][][]>([])
let currentStroke: [number, number][] = []
let isDrawing = false

function toggleDrawing() {
  drawingActive.value = !drawingActive.value
  if (drawingActive.value) {
    clearDrawing()
    enableDrawing()
    centerMarker?.remove()
    centerMarker = null
    emit('clear-center')
  } else {
    disableDrawing()
  }
  emit('drawing-change', drawingActive.value)
}

function enableDrawing() {
  if (!map) return
  map.dragPan.disable()
  map.on('mousedown', onDrawStart)
  map.on('mousemove', onDrawMove)
  map.on('mouseup', onDrawEnd)
  map.on('touchstart', onDrawStart)
  map.on('touchmove', onDrawMove)
  map.on('touchend', onDrawEnd)
}

function disableDrawing() {
  if (!map) return
  map.dragPan.enable()
  map.off('mousedown', onDrawStart)
  map.off('mousemove', onDrawMove)
  map.off('mouseup', onDrawEnd)
  map.off('touchstart', onDrawStart)
  map.off('touchmove', onDrawMove)
  map.off('touchend', onDrawEnd)
}

function onDrawStart(e: mapboxgl.MapMouseEvent | mapboxgl.MapTouchEvent) {
  isDrawing = true
  currentStroke = [[e.lngLat.lng, e.lngLat.lat]]
}

function onDrawMove(e: mapboxgl.MapMouseEvent | mapboxgl.MapTouchEvent) {
  if (!isDrawing) return
  currentStroke.push([e.lngLat.lng, e.lngLat.lat])
  updateDrawingLayer()
}

function onDrawEnd() {
  if (!isDrawing) return
  isDrawing = false
  if (currentStroke.length > 1) {
    drawnStrokes.value.push([...currentStroke])
    emit('strokes-change', true)
  }
  currentStroke = []
  updateDrawingLayer()
}

function ensureDrawingLayer() {
  if (!map || !map.isStyleLoaded()) return
  if (map.getSource('drawing')) return
  map.addSource('drawing', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
  map.addLayer({
    id: 'drawing',
    type: 'line',
    source: 'drawing',
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: { 'line-color': MARKER_COLOR, 'line-width': 3, 'line-opacity': 0.9 },
  })
}

function updateDrawingLayer() {
  if (!map) return
  ensureDrawingLayer()
  const source = map.getSource('drawing') as mapboxgl.GeoJSONSource
  if (!source) return
  const all = [...drawnStrokes.value, ...(currentStroke.length > 1 ? [currentStroke] : [])]
  source.setData({
    type: 'FeatureCollection',
    features: all.map(stroke => ({
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: stroke },
    })),
  })
}

function undoStroke() {
  drawnStrokes.value.pop()
  updateDrawingLayer()
  if (drawnStrokes.value.length === 0) emit('strokes-change', false)
}

function clearDrawing() {
  drawnStrokes.value = []
  currentStroke = []
  isDrawing = false
  updateDrawingLayer()
  emit('strokes-change', false)
}

function reset() {
  if (drawingActive.value) {
    drawingActive.value = false
    disableDrawing()
    emit('drawing-change', false)
  }
  clearDrawing()
  centerMarker?.remove()
  centerMarker = null
}

defineExpose({ getStrokes: () => drawnStrokes.value, clearDrawing, reset })

watch(() => props.locationReady, (ready) => {
  if (ready) initMap(props.lng, props.lat)
})

watch(() => props.routeGeoJson, (geojson) => {
  if (!map) return
  if (geojson) {
    drawRoute(geojson)
  } else {
    if (map.getLayer('route')) map.removeLayer('route')
    if (map.getSource('route')) map.removeSource('route')
  }
})

watch(() => props.selectedCenter, (center) => {
  if (!center || !map) return

  if (locationMarker) {
    locationMarker.remove()
    locationMarker = null
    const el = document.createElement('div')
    el.style.cssText = 'width:14px;height:14px;background:#4285f4;border:2.5px solid #ffffff;border-radius:50%;box-shadow:0 0 0 2px #4285f4;'
    new mapboxgl.Marker({ element: el })
      .setLngLat([props.lng, props.lat])
      .addTo(map)
  }

  centerMarker?.remove()
  centerMarker = new mapboxgl.Marker({ color: ROUTE_COLOR })
    .setLngLat([center.lng, center.lat])
    .addTo(map)
})

function initMap(lng: number, lat: number) {
  if (!mapContainer.value) return
  map = new mapboxgl.Map({
    container: mapContainer.value,
    style: 'mapbox://styles/mapbox/outdoors-v12',
    center: [lng, lat],
    zoom: 14,
  })
  locationMarker = new mapboxgl.Marker({ color: MARKER_COLOR })
    .setLngLat([lng, lat])
    .addTo(map)
  map.getCanvas().style.cursor = 'crosshair'
  map.on('click', (e) => {
    if (drawingActive.value) return
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

  if (map.isStyleLoaded()) apply()
  else map.once('idle', apply)
}

onUnmounted(() => { disableDrawing(); map?.remove() })
</script>

<style scoped>
.map {
  flex: 1;
  height: 100%;
  width: 100%;
  position: relative;
}

.map-error {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  gap: 0.5rem;
}

.map-error__icon {
  color: var(--color-secondary);
  opacity: 0.7;
  margin-bottom: 0.25rem;
}

.map-error__title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-secondary);
  margin: 0;
}

.map-error__body {
  font-size: 0.85rem;
  color: var(--color-text-muted, #888);
  max-width: 22rem;
  margin: 0;
  line-height: 1.5;
}

.map-undo-btn {
  position: absolute;
  top: 4.5rem;
  left: 0.75rem;
  z-index: 10;
  width: 3rem;
  height: 3rem;
  border-radius: 8px;
  border: 2px solid var(--color-secondary);
  background: #ffffff;
  color: black;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
  transition: all 0.15s ease;
}

.map-undo-btn:hover {
  background: var(--color-secondary);
  color: #ffffff;
}

.map-draw-btn {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  z-index: 10;
  width: 3rem;
  height: 3rem;
  border-radius: 8px;
  border: 2px solid var(--color-secondary);
  background: #ffffff;
  color: black;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
  transition: all 0.15s ease;
}

.map-draw-btn:hover {
  border-color: var(--color-secondary);
  transition: 0.2s ease;
  background: #45ada8cd;
}

.map-draw-btn--active {
  background: var(--color-secondary);
  border-color: var(--color-secondary);
  color: #ffffff;
  transition: 0.2s ease;
}

.distance-controls {
  position: absolute;
  top: 0.75rem;
  right: 1.25rem;
  display: flex;
  flex-direction: row-reverse;
  align-items: center;
  gap: 0.9rem;
  z-index: 10;
}

.unit-toggle {
  display: flex;
  background: #ffffff;
  border: 2px solid var(--color-primary);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
  height: 3rem;
}

.unit-toggle button {
  padding: 0 0.65rem;
  font-size: 0.72rem;
  font-weight: 600;
  background: transparent;
  border: none;
  color: var(--color-primary);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.unit-toggle button:first-child {
  border-right: 1.5px solid var(--color-primary);
}

.unit-toggle--active {
  background: var(--color-primary) !important;
  color: #ffffff !important;
}

.distance-badge {
  background: #ffffff;
  border: 2px solid var(--color-primary);
  color: var(--color-primary);
  padding: 0 1rem;
  border-radius: 8px;
  pointer-events: none;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  height: 3rem;
  box-sizing: border-box;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
}

.distance-value {
  font-size: 1.1rem;
  font-weight: 700;
}

.distance-unit {
  font-size: 0.72rem;
  font-weight: 500;
  opacity: 0.75;
}

.loading-message {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color : var(--color-primary);
  font-weight: bold;
}
.loader {
  width: 48px;
  height: 48px;
  margin: auto;
  margin-top: 12rem;
  position: relative;
}
.loader:before {
  content: '';
  width: 48px;
  height: 5px;
  background: #000;
  opacity: 0.25;
  position: absolute;
  top: 60px;
  left: 0;
  border-radius: 50%;
  animation: shadow 0.5s linear infinite;
  }
.loader:after {
  content: '';
  width: 100%;
  height: 100%;
  background: var(--color-primary);
  animation: bxSpin 0.5s linear infinite;
  position: absolute;
  top: 0;
  left: 0;
  border-radius: 4px;
}
@keyframes bxSpin {
  17% {
    border-bottom-right-radius: 3px;
  }
  25% {
    transform: translateY(9px) rotate(22.5deg);
  }
  50% {
    transform: translateY(18px) scale(1, .9) rotate(45deg);
    border-bottom-right-radius: 40px;
  }
  75% {
    transform: translateY(9px) rotate(67.5deg);
  }
  100% {
    transform: translateY(0) rotate(90deg);
  }
}

@keyframes shadow {
  0%, 100% {
    transform: scale(1, 1);
  }
  50% {
    transform: scale(1.2, 1);
  }
}

@keyframes rotation {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
} 
</style>
