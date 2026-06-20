<template>
  <div class="top-panel" :style="{ '--color-active': activeColor }">
    <div class="input-area">
      <div v-if="props.activeTab === 'text'" class="text-input">
        <input v-model="routeText" type="text" placeholder="run" maxlength="5" />
      </div>
      <div v-else class="draw-input">
        <DrawCanvas ref="drawCanvasRef" :disabled="mapDrawActive" @draw-start="emit('canvas-draw-start')" />
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
      <button class="submit-btn" :disabled="loading" @click="handleSubmit">{{ buttonText }}</button>
      <button v-if="hasRoute" class="clear-route-btn" @click="emit('clear-route')">Clear Route</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import DrawCanvas from './DrawCanvas.vue'
import { PhPersonSimpleBike, PhPersonSimpleRun } from '@phosphor-icons/vue'

const props = defineProps<{ activeTab: 'draw' | 'text'; mapDrawActive?: boolean; hasMapStrokes?: boolean; hasRoute?: boolean }>()

const drawCanvasRef = ref<InstanceType<typeof DrawCanvas> | null>(null)
const routeText = ref('')
const error = ref('')

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
  'clear-route': []
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
}

.submit-btn:hover {
  background: var(--color-active);
  color: #ffffff;
}
</style>
