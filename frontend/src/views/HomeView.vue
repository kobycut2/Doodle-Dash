<template>
  <div class="brand">
    <span class="brand-doodle">Doodle</span>
    <span class="brand-dash">Dash</span>
  </div>
  <div class="home">
    <TopPanel @submit="handleSubmit" />
    <DoodleMap :route-text="routeData.text" :distance="routeData.distance" />
    <div class="bottom-spacer" />
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import TopPanel from '../components/TopPanel.vue'
import DoodleMap from '../components/DoodleMap.vue'

const routeData = reactive({ text: '', distance: 5 })

function handleSubmit(payload: { text: string; distance: number }) {
  routeData.text = payload.text
  routeData.distance = payload.distance
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
