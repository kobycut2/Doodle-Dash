<template>
  <div class="home">
    <div class="app-header">
      <div class="brand">
        <span class="brand-geo">GeoGlyph</span>
        <span class="brand-go">Go</span>
      </div>
      <div class="header-squiggle">
        <svg class="squiggle-svg" viewBox="0 0 960 36" preserveAspectRatio="none" overflow="visible">
          <defs>
            <linearGradient id="teal-pink-gradient" x1="0" y1="0" x2="960" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#45ada8"/>
              <stop offset="40%" stop-color="#7a7ed4"/>
              <stop offset="60%" stop-color="#c46cb4"/>
              <stop offset="100%" stop-color="#cc527a"/>
            </linearGradient>
          </defs>
          <path id="squiggle-path-line" class="squiggle-path" d="M0,28 C10,20 30,20 40,28 C50,36 70,36 80,28 C90,20 110,20 120,28 C130,36 150,36 160,28 C170,20 190,20 200,28 C210,36 230,36 240,28 C250,20 270,20 280,28 C290,36 310,36 320,28 C330,20 350,20 360,28 C370,36 390,36 400,28 C410,20 430,20 440,28 C450,36 470,36 480,28 C490,20 510,20 520,28 C530,36 550,36 560,28 C570,20 590,20 600,28 C610,36 630,36 640,28 C650,20 670,20 680,28 C690,36 710,36 720,28 C730,20 750,20 760,28 C770,36 790,36 800,28 C810,20 830,20 840,28 C850,36 870,36 880,28 C890,20 910,20 920,28 C930,36 950,36 960,28"/>
          <!-- Biker: waits 60s, goes (60–80s), waits 140s -->
          <g>
            <animateMotion dur="220s" repeatCount="indefinite" rotate="auto" calcMode="linear"
              keyPoints="0;0;1;1" keyTimes="0;0.273;0.364;1">
              <mpath href="#squiggle-path-line"/>
            </animateMotion>
            <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;0.273;0.273;0.364;0.364;1" dur="220s" repeatCount="indefinite"/>
            <g transform="scale(0.05, 0.075) translate(-128, -220)">
              <path fill="#45ada8" fill-opacity="0.85" d="M168,84a32,32,0,1,0-32-32A32,32,0,0,0,168,84Zm0-40a8,8,0,1,1-8,8A8,8,0,0,1,168,44Zm36,96a40,40,0,1,0,40,40A40,40,0,0,0,204,140Zm0,56a16,16,0,1,1,16-16A16,16,0,0,1,204,196ZM54,136a42,42,0,1,0,42,42A42,42,0,0,0,54,136Zm0,60a18,18,0,1,1,18-18A18,18,0,0,1,54,196Zm134-68H152a12,12,0,0,1-8.49-3.51L120,101l-15,15,31.52,31.51A12,12,0,0,1,140,156v48a12,12,0,0,1-24,0V161L79.51,124.49a12,12,0,0,1,0-17l32-32a12,12,0,0,1,17,0L157,104h31a12,12,0,0,1,0,24Z">
                <animate attributeName="fill" values="#45ada8;#cc527a" dur="20s" repeatCount="indefinite"/>
              </path>
            </g>
          </g>
          <!-- Runner: waits 140s, goes (140–160s), waits 60s -->
          <g>
            <animateMotion dur="220s" repeatCount="indefinite" rotate="auto" calcMode="linear"
              keyPoints="0;0;1;1" keyTimes="0;0.636;0.727;1">
              <mpath href="#squiggle-path-line"/>
            </animateMotion>
            <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;0.636;0.636;0.727;0.727;1" dur="220s" repeatCount="indefinite"/>
            <g transform="scale(0.05, 0.075) translate(-128, -220)">
              <path fill="#45ada8" fill-opacity="0.85" d="M152,92a36,36,0,1,0-36-36A36,36,0,0,0,152,92Zm0-48a12,12,0,1,1-12,12A12,12,0,0,1,152,44Zm76,93.4a12,12,0,0,1-7,10.91,66,66,0,0,1-21.47,3.78c-14,0-34.25-3.82-59.77-19a177,177,0,0,1-10.27,21C153.12,162.83,188,183.8,188,232a12,12,0,0,1-24,0c0-18.69-6.95-33.06-21.26-43.94-9.16-7-19.55-11-27.43-13.34-.81,1-1.64,2-2.5,2.95-20,22.87-44.82,34.76-72.25,34.76a97.33,97.33,0,0,1-9.75-.49,12,12,0,1,1,2.39-23.88c52.3,5.22,77.48-45.92,85.79-67.75C84.8,102.46,63.74,118.78,63.51,119a12,12,0,0,1-15-18.72C50.08,99,88,69.44,142.75,106.62c43.1,29.31,68.1,19.92,68.5,19.76a12,12,0,0,1,16.75,11Z">
                <animate attributeName="fill" values="#45ada8;#cc527a" dur="20s" repeatCount="indefinite"/>
              </path>
            </g>
          </g>
        </svg>
      </div>
    </div>
    <div class="content">
      <div class="left-panel">
        <div class="panel-card" :style="{ '--color-active': activeColor }">
          <div class="panel-tab-bar">
            <button
              class="tab tab--draw"
              :class="{ 'tab--draw--active': activeTab === 'draw' }"
              @click="handleTabChange('draw')"
            >Draw Route</button>
            <button
              class="tab tab--text"
              :class="{ 'tab--text--active': activeTab === 'text' }"
              @click="handleTabChange('text')"
            >Input Text</button>
          </div>
          <TopPanel ref="topPanelRef" :active-tab="activeTab" @submit="handleSubmit" @canvas-draw-start="handleCanvasDrawStart" @clear-route="handleClearRoute" :map-draw-active="mapDrawActive" :has-map-strokes="hasMapStrokes" :has-route="!!routeGeoJson" :route-geo-json="routeGeoJson" />
        </div>
      </div>
      <div class="right-panel">
        <div class="panel-card map-card">
          <DoodleMap
            ref="doodleMapRef"
            :route-text="routeData.text"
            :distance="routeData.distance"
            :lat="location.lat"
            :lng="location.lng"
            :location-ready="location.ready"
            :location-error="location.error"
            :route-geo-json="routeGeoJson"
            :selected-center="routeCenter"
            :actual-distance-miles="actualDistanceMiles"
            :show-draw-btn="activeTab === 'draw'"
            @select-center="handleSelectCenter"
            @clear-center="routeCenter = null"
            @drawing-change="mapDrawActive = $event"
            @strokes-change="hasMapStrokes = $event"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
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
const doodleMapRef = ref<InstanceType<typeof DoodleMap> | null>(null)
const topPanelRef = ref<InstanceType<typeof TopPanel> | null>(null)
const activeTab = ref<'draw' | 'text'>('draw')
const mapDrawActive = ref(false)
const hasMapStrokes = ref(false)

const activeColor = computed(() =>
  activeTab.value === 'text' ? 'var(--color-primary)' : 'var(--color-secondary)'
)

function handleSelectCenter(center: { lat: number; lng: number }) {
  routeCenter.value = center
}

function handleCanvasDrawStart() {
  doodleMapRef.value?.clearDrawing()
}

function handleClearRoute() {
  routeGeoJson.value = null
  actualDistanceMiles.value = null
}

function handleTabChange(tab: 'draw' | 'text') {
  if (activeTab.value === tab) return
  activeTab.value = tab
  handleClearRoute()
  routeCenter.value = null
  doodleMapRef.value?.reset()
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
  activity: 'run' | 'bike'
  strokes: Array<Array<{ x: number; y: number }>>
}) {
  routeData.text = payload.text
  routeData.distance = payload.distance

  const center = routeCenter.value ?? { lat: location.lat, lng: location.lng }
  const gpsStrokes = doodleMapRef.value?.getStrokes() ?? []
  const useMapDraw = gpsStrokes.length > 0
  doodleMapRef.value?.clearDrawing()

  let letters: Array<Array<Array<[number, number]>>>
  if (useMapDraw) {
    letters = gpsStrokes.map(s => [s])
  } else if (payload.mode === 'draw') {
    letters = drawnStrokesToScaledLetterGroups(payload.strokes, center.lat, center.lng, payload.distance)
  } else {
    letters = textToScaledLetterGroups(payload.text, center.lat, center.lng, payload.distance)
  }

  let result: { type: string; features: any[] } | null = null
  try {
    if (useMapDraw || payload.mode === 'draw') {
      result = await matchDrawingViaBackend(letters)
      if (!result) result = await matchLetters(letters, MAPBOX_TOKEN)
    } else {
      result = await matchLetters(letters, MAPBOX_TOKEN)
    }
  } finally {
    topPanelRef.value?.stopScramble()
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
.home {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--color-background);
  --panel-width: 50rem;
}

.app-header {
  position: relative;
  width: 100%;
  padding: 1rem 1.25rem;
  background: var(--color-panels);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  justify-content: flex-start;
  align-items: center;
  flex-shrink: 0;
}

.brand {
  display: flex;
  align-items: baseline;
  gap: 0.3em;
  font-size: 1.8rem;
  font-weight: 700;
  margin-left: 2rem;
}

.brand-geo {
  color: var(--color-secondary);
  font-weight: 500;
  letter-spacing: 0.04em;
}

.brand-go {
  color: var(--color-primary);
  position: relative;
  z-index: 1;
}

.header-squiggle {
  flex: 1;
  overflow: hidden;
  display: flex;
  align-items: center;
  padding: 0 1rem;
  transform: translateY(-6px);
}

.squiggle-svg {
  width: 100%;
  height: 28px;
}

.squiggle-path {
  fill: none;
  stroke: url(#teal-pink-gradient);
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-dasharray: 7 5;
  animation: squiggle-flow 2s linear infinite;
}

@keyframes squiggle-flow {
  to { stroke-dashoffset: -24; }
}

.panel-tab-bar {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  padding: 1.25rem 1.25rem 0;
  flex-shrink: 0;
}

.tabs {
  display: flex;
  gap: 0.5rem;
}

.tab {
  padding: 8px 16px;
  border-radius: 8px;
  border: 1.5px solid;
  background: transparent;
  font-family: 'Poppins', sans-serif;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tab--text {
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.tab--draw {
  color: var(--color-secondary);
  border-color: var(--color-secondary);
}

.tab--draw:hover {
  opacity: 0.8;
}

.tab--text--active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.tab--text:hover {
  opacity: 0.8;
}

.tab--draw--active {
  background: var(--color-secondary);
  border-color: var(--color-secondary);
  color: white;
}

.content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.left-panel {
  width: var(--panel-width);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  overflow-y: auto;
}

.panel-card {
  background: var(--color-panels);
  border-radius: 12px;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.06);
}


.right-panel {
  flex: 1;
  padding: 1rem 1rem 1rem 0;
  display: flex;
  flex-direction: column;
}

@media (max-width: 700px) {
  .content {
    flex-direction: column;
  }

  .left-panel {
    width: 100%;
  }
}
</style>
