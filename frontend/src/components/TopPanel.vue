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
        <input v-model="routeText" type="text" placeholder="running sucks" maxlength="20" />
      </div>
      <div v-else class="draw-placeholder">
        <span>Drawing canvas coming soon</span>
      </div>
    </div>

    <div class="distance-selector">
      <button
        v-for="miles in distanceOptions"
        :key="miles"
        class="distance-btn"
        :class="{ 'distance-btn--active': selectedDistance === miles }"
        @click="selectedDistance = miles"
      >
        {{ miles }}mi
      </button>
    </div>

    <p v-if="error" class="error">{{ error }}</p>
    <button class="submit-btn" @click="handleSubmit">Find Route</button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const activeTab = ref<'text' | 'draw'>('text')
const routeText = ref('')
const error = ref('')
const distanceOptions = [3, 5, 8, 10, 13, 16, 20, 26, 32]
const selectedDistance = ref<number>(5)

const activeColor = computed(() =>
  activeTab.value === 'text' ? 'var(--color-primary)' : 'var(--color-secondary)'
)

const emit = defineEmits<{
  submit: [payload: { text: string; distance: number }]
}>()

function handleSubmit() {
  if (!routeText.value.trim()) {
    error.value = 'What would you like to doodle today? Please provide route text or a drawing.'
    return
  }
  error.value = ''
  emit('submit', { text: routeText.value, distance: selectedDistance.value })
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

.draw-placeholder {
  width: 100%;
  height: 42px;
  border: 2px dashed #d0c8d8;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #bbb;
  font-size: 0.85rem;
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
