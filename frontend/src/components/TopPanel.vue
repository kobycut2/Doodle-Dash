<template>
  <div class="top-panel" :style="{ '--color-active': activeColor }">
    <div class="controls" :class="{ 'controls--disabled': props.isTracking }">
      <div class="input-area">
        <div v-if="props.activeTab === 'text'" class="text-input">
          <input v-model="routeText" type="text" placeholder="run" maxlength="5" />
        </div>
        <div v-else class="draw-input">
          <DrawCanvas ref="drawCanvasRef" :disabled="mapDrawActive" @draw-start="emit('canvas-draw-start')" @strokes-change="hasCanvasStrokes = $event" />
        </div>
      </div>

      <div class="options-row">
        <div class="activity-section">
          <PhPersonSimpleRun v-if="activityMode === 'run'" class="activity-icon" />
          <PhPersonSimpleBike v-else class="activity-icon" />
          <div class="activity-toggle">
            <button
              class="activity-btn"
              :class="{ 'activity-btn--active': activityMode === 'run' }"
              @click="activityMode = 'run'"
            >Run</button>
            <button
              class="activity-btn"
              :class="{ 'activity-btn--active': activityMode === 'bike' }"
              @click="activityMode = 'bike'"
            >Bike</button>
          </div>
        </div>
        <div class="distance-selector">
          <button
            v-for="opt in sizeOptions"
            :key="opt.value"
            class="distance-btn"
            :class="{ 'distance-btn--active': selectedDistance === opt.value }"
            @click="selectedDistance = opt.value"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>

      <p v-if="error" class="error">{{ error }}</p>
      <div class="submit-row">
        <button class="submit-btn" :disabled="loading" @click="handleSubmit">{{ buttonText }}<PhMapPin :size="22" :weight="canSubmit ? 'fill' : 'regular'" /></button>
      </div>
    </div>
    <div class="export-row">
      <div v-if="routeGeoJson" class="export-btn-wrap" :class="{ 'controls--disabled': props.isTracking }">
        <span class="recommended-badge">Recommended</span>
        <button class="export-btn" @click="exportGpx(routeGeoJson)">
          Export GPX <PhDownloadSimple :size="16" weight="bold" />
        </button>
      </div>
      <button v-if="isTracking" class="stop-btn" @click="emit('stop-tracking')">
        Stop <PhStop :size="16" weight="fill" />
      </button>
      <button v-if="routeGeoJson && !isTracking" class="go-btn" @click="emit('start-tracking')">
        Go! <PhPlay :size="16" weight="fill" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

import DrawCanvas from './DrawCanvas.vue'
import { PhPersonSimpleBike, PhPersonSimpleRun, PhMapPin, PhDownloadSimple, PhPlay, PhStop } from '@phosphor-icons/vue'
import { exportGpx } from '../utils/exportGpx'

const props = defineProps<{ activeTab: 'draw' | 'text'; mapDrawActive?: boolean; hasMapStrokes?: boolean; routeGeoJson?: object | null; isTracking?: boolean }>()

const drawCanvasRef = ref<InstanceType<typeof DrawCanvas> | null>(null)
const routeText = ref('')
const error = ref('')
const hasCanvasStrokes = ref(false)

const canSubmit = computed(() => {
  if (props.activeTab === 'text') return routeText.value.trim().length > 0
  return hasCanvasStrokes.value || !!props.hasMapStrokes
})

const RUN_OPTIONS = [
  { label: 'XS', value: 2 },
  { label: 'S',  value: 5 },
  { label: 'M',  value: 8 },
  { label: 'L',  value: 11 },
  { label: 'XL', value: 15 },
]

const BIKE_OPTIONS = [
  { label: 'XS', value: 5 },
  { label: 'S',  value: 15 },
  { label: 'M',  value: 30 },
  { label: 'L',  value: 60 },
  { label: 'XL', value: 100 },
]

const activityMode = ref<'run' | 'bike'>('run')
const sizeOptions = computed(() => activityMode.value === 'run' ? RUN_OPTIONS : BIKE_OPTIONS)
const selectedDistance = ref<number>(8)

watch(activityMode, (mode) => {
  selectedDistance.value = mode === 'run' ? 8 : 30
})

const activeColor = computed(() =>
  props.activeTab === 'text' ? 'var(--color-primary)' : 'var(--color-secondary)'
)


const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%&'
const TARGET = 'Find Route'
const loading = ref(false)
const buttonText = ref(TARGET)

let scrambleInterval: ReturnType<typeof setInterval> | null = null

function scramble() {
  loading.value = true
  scrambleInterval = setInterval(() => {
    buttonText.value = TARGET.split('').map((char) => {
      if (char === ' ') return ' '
      return CHARS[Math.floor(Math.random() * CHARS.length)]
    }).join('')
  }, 80)
}

function stopScramble() {
  if (scrambleInterval) {
    clearInterval(scrambleInterval)
    scrambleInterval = null
  }
  let iteration = 0
  const settleInterval = setInterval(() => {
    buttonText.value = TARGET.split('').map((char, i) => {
      if (char === ' ') return ' '
      if (i < iteration) return char
      return CHARS[Math.floor(Math.random() * CHARS.length)]
    }).join('')
    if (iteration >= TARGET.length) {
      clearInterval(settleInterval)
      buttonText.value = TARGET
      loading.value = false
    }
    iteration += 0.5
  }, 40)
}

defineExpose({ stopScramble })

const emit = defineEmits<{
  submit: [payload: {
    mode: 'text' | 'draw'
    text: string
    distance: number
    activity: 'run' | 'bike'
    strokes: Array<Array<{ x: number; y: number }>>
  }]
  'canvas-draw-start': []
  'start-tracking': []
  'stop-tracking': []
}>()

watch(() => props.mapDrawActive, (active) => {
  if (active) drawCanvasRef.value?.clear()
})

watch(() => props.activeTab, () => {
  error.value = ''
  drawCanvasRef.value?.clear()
})

function handleSubmit() {
  error.value = ''
  if (props.activeTab === 'text') {
    if (!routeText.value.trim()) {
      error.value = 'What would you like to doodle today? Input text or a drawing first.'
      return
    }
    if (routeText.value.replace(/\s/g, '').length > 5) {
      error.value = 'Max 5 letters.'
      return
    }
  } else {
    const drawn = drawCanvasRef.value?.getStrokes() ?? []
    if (drawn.length === 0 && !props.hasMapStrokes) {
      error.value = 'What would you like to doodle today? Input text or a drawing first.'
      return
    }
  }
  scramble()
  emit('submit', {
    mode: props.activeTab,
    text: routeText.value,
    distance: selectedDistance.value,
    activity: activityMode.value,
    strokes: drawCanvasRef.value?.getStrokes() ?? [],
  })
}
</script>

<style scoped>
.top-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 1rem 2rem 1.5rem;
  background: transparent;
  flex: 1;
  width: 100%;
}


.controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  width: 100%;
}

.controls--disabled {
  opacity: 0.4;
  pointer-events: none;
  user-select: none;
}

.input-area {
  width: 100%;
}

.text-input input {
  width: 100%;
  padding: 10px 14px;
  border: 1.5px solid #d0c8d8;
  border-radius: 8px;
  font-family: 'Poppins', sans-serif;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s ease;
}

.text-input input:focus {
  border-color: var(--color-active);
}

.draw-input {
  width: 100%;
}

.options-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.distance-selector {
  display: flex;
  gap: 0.5rem;
}

.distance-btn {
  padding: 7px 16px;
  border-radius: 20px;
  border: 1.5px solid var(--color-active);
  background: transparent;
  color: var(--color-active);
  font-family: 'Poppins', sans-serif;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.distance-btn:hover {
  opacity: 0.8;
}

.distance-btn--active {
  background: var(--color-active);
  color: #ffffff;
}

.error {
  font-size: 0.85rem;
  color: black;
}

.submit-row {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  gap: 1rem;
  margin-top: 1.5rem;
}

.activity-section {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.activity-icon {
  width: 36px;
  height: 36px;
  color: var(--color-active);
  flex-shrink: 0;
}

.activity-toggle {
  display: flex;
  border-radius: 8px;
  border: 1.5px solid var(--color-active);
  overflow: hidden;
}

.activity-toggle:hover {
  opacity: 0.8;
}

.clear-route-btn {
  padding: 12px 16px;
  border-radius: 8px;
  border: 1.5px solid var(--color-active);
  background: transparent;
  color: var(--color-active);
  font-family: 'Poppins', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.clear-route-btn:hover {
  background: var(--color-active);
  color: #ffffff;
  transform: scale(1.03);
}

.export-row {
  margin-top: auto;
  width: 100%;
  display: flex;
  justify-content: flex-end;
  align-items: flex-end;
  padding-bottom: 0.25rem;
  gap: 0.75rem;
}

.export-btn-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.recommended-badge {
  font-family: 'Poppins', sans-serif;
  font-size: 0.65rem;
  font-weight: 600;
  color: var(--color-active);
  background: color-mix(in srgb, var(--color-active) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-active) 35%, transparent);
  border-radius: 20px;
  padding: 1px 8px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  white-space: nowrap;
}

.export-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 7px 14px;
  border-radius: 8px;
  border: 1.5px solid var(--color-active);
  background: transparent;
  color: var(--color-active);
  font-family: 'Poppins', sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.export-btn:hover {
  background: var(--color-active);
  color: #ffffff;
  transform: scale(1.03);
}

.go-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 7px 18px;
  border-radius: 8px;
  border: 1.5px solid var(--color-active);
  background: var(--color-active);
  color: #ffffff;
  font-family: 'Poppins', sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.go-btn:hover {
  opacity: 0.85;
  transform: scale(1.03);
}

.stop-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 7px 18px;
  border-radius: 8px;
  border: 1.5px solid #e53e3e;
  background: #e53e3e;
  color: #ffffff;
  font-family: 'Poppins', sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.stop-btn:hover {
  opacity: 0.85;
  transform: scale(1.03);
}

.activity-btn {
  padding: 10px 10px;
  background: transparent;
  border: none;
  color: var(--color-active);
  font-family: 'Poppins', sans-serif;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.activity-btn + .activity-btn {
  border-left: 1.5px solid var(--color-active);
}

.activity-btn--active {
  background: var(--color-active);
  color: #ffffff;
}

.submit-btn {
  flex: 1;
  padding: 12px;
  background: transparent;
  border-radius: 8px;
  border: 1.5px solid var(--color-active);
  color: var(--color-active);
  font-family: 'Poppins', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
}

.submit-btn:hover:not(:disabled) {
  background: var(--color-active);
  color: #ffffff;
  transform: scale(1.03);
}

@media (max-width: 1150px) {
  .options-row {
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
  }

  .activity-icon {
    display: none;
  }
}

@media (max-width: 700px) {
  .top-panel {
    flex: none;
    gap: 0.6rem;
    padding: 0.5rem 1rem 0.75rem;
  }

  .controls {
    gap: 0.6rem;
  }

  .submit-row {
    margin-top: 0;
  }

  .export-row {
    margin-top: 0.5rem;
  }

  .distance-btn {
    padding: 5px 10px;
    font-size: 0.8rem;
  }
}
</style>
