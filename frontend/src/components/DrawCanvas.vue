<template>
  <div class="canvas-wrapper" :class="{ 'canvas-wrapper--disabled': disabled }">
    <canvas
      ref="canvasEl"
      class="draw-canvas"
      @pointerdown="startDraw"
      @pointermove="onDraw"
      @pointerup="endDraw"
      @pointerleave="endDraw"
    />
    <div v-if="strokes.length === 0 && !drawing" class="hint">Draw your shape here or draw directly on the map</div>
    <div v-if="strokes.length > 0" class="canvas-actions">
      <button class="canvas-action-btn" @click="undo">Undo</button>
      <button class="canvas-action-btn" @click="clear">Clear</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

type Pt = { x: number; y: number }

const props = defineProps<{ disabled?: boolean }>()
const emit = defineEmits<{ 'draw-start': [], 'strokes-change': [boolean] }>()

const canvasEl = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let drawing = false
let currentStroke: Pt[] = []
const strokes = ref<Pt[][]>([])

function perpendicularDist(pt: Pt, a: Pt, b: Pt): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len = Math.sqrt(dx * dx + dy * dy)
  if (len === 0) return Math.sqrt((pt.x - a.x) ** 2 + (pt.y - a.y) ** 2)
  return Math.abs(dy * pt.x - dx * pt.y + b.x * a.y - b.y * a.x) / len
}

function rdp(points: Pt[], epsilon: number): Pt[] {
  if (points.length <= 2) return points
  let maxDist = 0
  let maxIdx = 0
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpendicularDist(points[i], points[0], points[points.length - 1])
    if (d > maxDist) { maxDist = d; maxIdx = i }
  }
  if (maxDist > epsilon) {
    const left = rdp(points.slice(0, maxIdx + 1), epsilon)
    const right = rdp(points.slice(maxIdx), epsilon)
    return [...left.slice(0, -1), ...right]
  }
  return [points[0], points[points.length - 1]]
}

function startDraw(e: PointerEvent) {
  if (!canvasEl.value) return
  emit('draw-start')
  drawing = true
  const rect = canvasEl.value.getBoundingClientRect()
  currentStroke = [{ x: e.clientX - rect.left, y: e.clientY - rect.top }]
  ;(e.target as HTMLCanvasElement).setPointerCapture(e.pointerId)
}

function onDraw(e: PointerEvent) {
  if (!drawing || !canvasEl.value || !ctx) return
  const rect = canvasEl.value.getBoundingClientRect()
  currentStroke.push({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  redraw()
}

function endDraw() {
  if (!drawing) return
  drawing = false
  if (currentStroke.length >= 2) {
    strokes.value.push(rdp(currentStroke, 6))
  }
  currentStroke = []
  redraw()
  emit('strokes-change', strokes.value.length > 0)
}

function redraw() {
  if (!ctx || !canvasEl.value) return
  ctx.clearRect(0, 0, canvasEl.value.width, canvasEl.value.height)
  ctx.strokeStyle = '#cc527a'
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  const all = [...strokes.value, ...(currentStroke.length >= 2 ? [currentStroke] : [])]
  for (const stroke of all) {
    if (stroke.length < 2) continue
    ctx.beginPath()
    ctx.moveTo(stroke[0].x, stroke[0].y)
    for (let i = 1; i < stroke.length; i++) ctx.lineTo(stroke[i].x, stroke[i].y)
    ctx.stroke()
  }
}

function undo() {
  strokes.value.pop()
  redraw()
  emit('strokes-change', strokes.value.length > 0)
}

function clear() {
  strokes.value = []
  currentStroke = []
  redraw()
  emit('strokes-change', false)
}

onMounted(() => {
  if (!canvasEl.value) return
  ctx = canvasEl.value.getContext('2d')
  const ro = new ResizeObserver(() => {
    if (!canvasEl.value) return
    canvasEl.value.width = canvasEl.value.offsetWidth
    canvasEl.value.height = canvasEl.value.offsetHeight
    redraw()
  })
  ro.observe(canvasEl.value)
  onUnmounted(() => ro.disconnect())
})

defineExpose({ getStrokes: () => strokes.value, clear, undo })
</script>

<style scoped>
.canvas-wrapper {
  position: relative;
  width: 100%;
  height: 400px;
  border: 2px dashed var(--color-secondary);
  border-radius: 8px;
  overflow: hidden;
  cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Cline x1='12' y1='2' x2='12' y2='22' stroke='%23cc527a' stroke-width='2'/%3E%3Cline x1='2' y1='12' x2='22' y2='12' stroke='%23cc527a' stroke-width='2'/%3E%3Ccircle cx='12' cy='12' r='2.5' fill='%23cc527a'/%3E%3C/svg%3E") 12 12, crosshair;
}

.draw-canvas {
  width: 100%;
  height: 100%;
  display: block;
  touch-action: none;
}

.hint {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-secondary);
  font-size: 1rem;
  font-family: 'Poppins', sans-serif;
  pointer-events: none;
}

.canvas-actions {
  position: absolute;
  top: 6px;
  right: 8px;
  display: flex;
  gap: 4px;
}

.canvas-action-btn {
  padding: 2px 10px;
  border: 1px solid #cc527a;
  border-radius: 4px;
  background: white;
  color: #cc527a;
  font-family: 'Poppins', sans-serif;
  font-size: 0.75rem;
  cursor: pointer;
  transition: background 0.15s;
}

.canvas-action-btn:hover {
  background: #fdeef3;
}

.canvas-wrapper--disabled {
  opacity: 0.4;
  pointer-events: none;
}
</style>
