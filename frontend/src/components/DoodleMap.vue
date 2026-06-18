<template>
  <div ref="mapContainer" class="map">
    <div v-if="error" class="map-error">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN as string

const mapContainer = ref<HTMLDivElement | null>(null)
const error = ref('')
let map: mapboxgl.Map | null = null

onMounted(() => {
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => initMap(coords.longitude, coords.latitude),
    () => { error.value = 'Location access denied. Please enable location permissions.' }
  )
})

function initMap(lng: number, lat: number) {
  if (!mapContainer.value) return
  map = new mapboxgl.Map({
    container: mapContainer.value,
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [lng, lat],
    zoom: 14,
  })
  new mapboxgl.Marker({ color: '#C06C84' })
    .setLngLat([lng, lat])
    .addTo(map)
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
</style>
