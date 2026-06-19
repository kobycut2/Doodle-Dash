<template>
  <div class="brand">
    <span class="brand-doodle">Doodle</span>
    <span class="brand-dash">Dash</span>
  </div>
  <div class="home">
    <TopPanel @submit="handleSubmit" />
    <DoodleMap
      :route-text="routeData.text"
      :distance="routeData.distance"
      :lat="location.lat"
      :lng="location.lng"
      :location-ready="location.ready"
      :location-error="location.error"
      :route-geo-json="routeGeoJson"
      :selected-center="routeCenter"
      :actual-distance-miles="actualDistanceMiles"
      @select-center="handleSelectCenter"
    />
    <div class="bottom-spacer" />
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import TopPanel from '../components/TopPanel.vue'
import DoodleMap from '../components/DoodleMap.vue'
import { textToScaledLetterGroups, drawnStrokesToScaledLetterGroups } from '../utils/textToPath'
import { matchLetters, matchDrawingViaBackend, routeLengthMiles } from '../utils/mapMatch'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string

const routeData = reactive({ text: '', distance: 5 })
const location = reactive({ lat: 0, lng: 0, ready: false, error: '' })
const routeGeoJson = ref<object | null>(null)
const routeCenter = ref<{ lat: number; lng: number } | null>(null)
const actualDistanceMiles = ref<number | null>(null)

function handleSelectCenter(center: { lat: number; lng: number }) {
  routeCenter.value = center
}

onMounted(() => {
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      location.lat = coords.latitude
      location.lng = coords.longitude
      location.ready = true
    },
    () => { location.error = 'Location access denied. Please enable location permissions.' }
  )
})

async function handleSubmit(payload: {
  mode: 'text' | 'draw'
  text: string
  distance: number
  strokes: Array<Array<{ x: number; y: number }>>
}) {
  routeData.text = payload.text
  routeData.distance = payload.distance

  const center = routeCenter.value ?? { lat: location.lat, lng: location.lng }
  const letters = payload.mode === 'draw'
    ? drawnStrokesToScaledLetterGroups(payload.strokes, center.lat, center.lng, payload.distance)
    : textToScaledLetterGroups(payload.text, center.lat, center.lng, payload.distance)
  let result: { type: string; features: any[] } | null = null
  if (payload.mode === 'draw') {
    result = await matchDrawingViaBackend(letters)
    if (!result) result = await matchLetters(letters, MAPBOX_TOKEN)
  } else {
    result = await matchLetters(letters, MAPBOX_TOKEN)
  }
  if (!result) {
    alert('Route generation failed — try tapping a different spot on the map.')
    return
  }
  const actualMiles = routeLengthMiles((result as any).features[0].geometry.coordinates)
  actualDistanceMiles.value = Math.round(actualMiles * 10) / 10
  routeGeoJson.value = result
}
</script>

<style scoped>
.brand {
  position: fixed;
  top: 1.25rem;
  left: 1.5rem;
  display: flex;
  gap: 0.3em;
  font-size: 2rem;
  font-weight: 700;
  z-index: 10;
}

@media (max-width: 700px) {
  .brand {
    left: 50%;
    transform: translateX(-50%);
  }
}

.brand-doodle {
  color: var(--color-primary);
}

.brand-dash {
  color: var(--color-secondary);
}

.home {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 900px;
  margin: 0 auto;
  background: var(--color-background);
  overflow: hidden;
}

.bottom-spacer {
  height: 2rem;
  flex-shrink: 0;
}
</style>
