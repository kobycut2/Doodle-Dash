<template>
  <div class="top-panel" :style="{ '--color-active': activeColor }">
    <div class="tabs">
      <button
        class="tab tab--text"
        :class="{ 'tab--text--active': activeTab === 'text' }"
        @click="activeTab = 'text'"
      >
        Input Text
      </button>
      <button
        class="tab tab--draw"
        :class="{ 'tab--draw--active': activeTab === 'draw' }"
        @click="activeTab = 'draw'"
      >
        Draw Route
      </button>
    </div>

    <div class="input-area">
      <div v-if="activeTab === 'text'" class="text-input">
        <input v-model="routeText" type="text" placeholder="run" maxlength="5" />
      </div>
      <div v-else class="draw-input">
        <DrawCanvas ref="drawCanvasRef" />
      </div>
    </div>

    <div class="distance-selector">
      <button
        v-for="opt in SIZE_OPTIONS"
        :key="opt.value"
        class="distance-btn"
        :class="{ 'distance-btn--active': selectedDistance === opt.value }"
        @click="selectedDistance = opt.value"
      >
        {{ opt.label }}
      </button>
    </div>

    <p v-if="error" class="error">{{ error }}</p>
    <button class="submit-btn" :disabled="loading" @click="handleSubmit">{{ buttonText }}</button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import DrawCanvas from './DrawCanvas.vue'

const activeTab = ref<'text' | 'draw'>('text')
const drawCanvasRef = ref<InstanceType<typeof DrawCanvas> | null>(null)
const routeText = ref('')
const error = ref('')
const SIZE_OPTIONS = [
  { label: 'XS', value: 2 },
  { label: 'S',  value: 5 },
  { label: 'M',  value: 8 },
  { label: 'L',  value: 11 },
  { label: 'XL', value: 15 },
]
const selectedDistance = ref<number>(8)

const activeColor = computed(() =>
  activeTab.value === 'text' ? 'var(--color-primary)' : 'var(--color-secondary)'
)

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%&'
const TARGET = 'Find Route'
const loading = ref(false)
const buttonText = ref(TARGET)

function scramble() {
  loading.value = true
  let iteration = 0
  const interval = setInterval(() => {
    buttonText.value = TARGET.split('').map((char, i) => {
      if (char === ' ') return ' '
      if (i < iteration) return char
      return CHARS[Math.floor(Math.random() * CHARS.length)]
    }).join('')

    if (iteration >= TARGET.length) {
      clearInterval(interval)
      buttonText.value = TARGET
      loading.value = false
    }
    iteration += 0.2
  }, 80)
}

const emit = defineEmits<{
  submit: [payload: {
    mode: 'text' | 'draw'
    text: string
    distance: number
    strokes: Array<Array<{ x: number; y: number }>>
  }]
}>()

function handleSubmit() {
  error.value = ''
  if (activeTab.value === 'text') {
    if (!routeText.value.trim()) {
      error.value = 'What would you like to doodle today?'
      return
    }
    if (routeText.value.replace(/\s/g, '').length > 5) {
      error.value = 'Max 5 letters.'
      return
    }
  } else {
    const drawn = drawCanvasRef.value?.getStrokes() ?? []
    if (drawn.length === 0) {
      error.value = 'Draw a shape first!'
      return
    }
  }
  scramble()
  emit('submit', {
    mode: activeTab.value,
    text: routeText.value,
    distance: selectedDistance.value,
    strokes: drawCanvasRef.value?.getStrokes() ?? [],
  })
}
</script>

<style scoped>
.top-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.25rem 1rem;
  background: var(--color-background);
  border-bottom: 1px solid #f0edf3;
}

.tabs {
  display: flex;
  gap: 0.5rem;
}

@media (max-width: 700px) {
  .tabs {
    padding-top: 3rem;
  }
}

.tab {
  flex: 1;
  padding: 8px;
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

.tab--text--active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.tab--draw--active {
  background: var(--color-secondary);
  border-color: var(--color-secondary);
  color: white;
}

.input-area {
  width: 70%;
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

.distance-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  justify-content: center;
}

.distance-btn {
  padding: 5px 12px;
  border-radius: 20px;
  border: 1.5px solid var(--color-active);
  background: transparent;
  color: var(--color-active);
  font-family: 'Poppins', sans-serif;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.distance-btn--active {
  background: var(--color-active);
  color: #ffffff;
}

.error {
  font-size: 0.85rem;
  color: var(--color-error);
}

.submit-btn {
  width: 70%;
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
