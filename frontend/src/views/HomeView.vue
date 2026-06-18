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
      @select-center="handleSelectCenter"
    />
    <div class="bottom-spacer" />
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import TopPanel from '../components/TopPanel.vue'
import DoodleMap from '../components/DoodleMap.vue'
import { textToPoints, scalePointsToLatLng } from '../utils/textToPath'

const routeData = reactive({ text: '', distance: 5 })
const location = reactive({ lat: 0, lng: 0, ready: false, error: '' })
const routeGeoJson = ref<object | null>(null)
const routeCenter = ref<{ lat: number; lng: number } | null>(null)

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

async function handleSubmit(payload: { text: string; distance: number }) {
  routeData.text = payload.text
  routeData.distance = payload.distance

  const center = routeCenter.value ?? { lat: location.lat, lng: location.lng }
  const points = textToPoints(payload.text)
  const lngLat = scalePointsToLatLng(points, center.lat, center.lng, payload.distance)

  const response = await fetch('http://localhost:3001/api/route', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ points: lngLat }),
  })

  if (response.ok) {
    routeGeoJson.value = await response.json()
  } else {
    const err = await response.json().catch(() => ({}))
    console.error('Route failed:', err)
    alert(err.error ?? 'Route generation failed — check the console for details.')
  }
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
