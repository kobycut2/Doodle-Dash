<template>
  <div class="top-panel">
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
        <input type="text" placeholder="running sucks" maxlength="20" />
      </div>
      <div v-else class="draw-placeholder">
        <span>Drawing canvas coming soon</span>
      </div>
    </div>

    <button class="submit-btn">Find Route</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const activeTab = ref<'text' | 'draw'>('text')
</script>

<style scoped>
.top-panel {
  display: flex;
  flex-direction: column;
  align-items : center;
  gap: 1rem;
  padding: 1.25rem 1.25rem 1rem;
  background: var(--color-background);
  border-bottom: 1px solid #f0edf3;
}

.brand {
  display: flex;
  gap: 0.3em;
  font-size: 1.4rem;
  font-weight: 700;
  align-self: flex-start;
}

.brand-doodle {
  color: var(--color-primary);
}

.brand-dash {
  color: var(--color-secondary);
}

.tabs {
  display: flex;
  gap: 0.5rem;
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
  border-color: var(--color-primary);
  color: white;
  transition: 0.4s;
  background: var(--color-primary);
}

.tab--draw--active {
  border-color: var(--color-secondary);
  color: white;
  transition: 0.4s;
  background: var(--color-secondary);
}

.input-area {
  width: 50%;
}

.text-input input {
  width: 100%;
  padding: 10px 14px;
  border: 1.5px solid #d0c8d8;
  border-radius: 8px;
  font-family: 'Poppins', sans-serif;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.15s ease;
}

.text-input input:focus {
  border-color: var(--color-primary);
}

.draw-placeholder {
  width: 100%;
  height: 42px;
  border: 2px #d0c8d8;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #bbb;
  font-size: 0.85rem;
}

.submit-btn {
  width: 50%;
  padding: 12px;
  background: transparent;
  border-radius: 8px;
  border: 1.5px solid var(--color-primary);
  color: white;
  font-family: 'Poppins', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: 0.4s;
}

.submit-btn:hover {
  background: var(--color-primary);
  color: #fff;
}
</style>
