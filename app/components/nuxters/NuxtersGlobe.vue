<script setup lang="ts">
import type { NuxtersCountry } from '#shared/types'
import type { Globe } from 'cobe'
import createGlobe from 'cobe'
import { COUNTRIES } from '#shared/utils/nuxters-countries'
import { faceOnGlobe, projectOnGlobe } from '~/utils/nuxters-globe'

const props = defineProps<{
  countries: NuxtersCountry[]
  /** ISO code of the selected country, the globe turns to it. */
  selected?: string | null
}>()
const emit = defineEmits<{ select: [code: string | null] }>()

const { format } = new Intl.NumberFormat('en-US')
const colorMode = useColorMode()
const container = useTemplateRef('container')
const canvas = useTemplateRef('canvas')
const failed = ref(false)
const ready = ref(false)
const paused = ref(false)
const zoom = ref(1)
// Zoomed in, countries show their best ranked Nuxters instead of a count.
const avatars = computed(() => zoom.value >= 1.6)

const DEFAULT_CAMERA = { phi: 0, theta: 0.2, zoom: 1 }
const MAX_ZOOM = 3
const markers = computed(() => props.countries
  .flatMap((country) => {
    const location = COUNTRIES[country.code]?.location
    return location ? [{ ...country, name: COUNTRIES[country.code]!.name, location }] : []
  })
  // The selected country first: it keeps its marker when others overlap it.
  .sort((a, b) => Number(b.code === props.selected) - Number(a.code === props.selected) || b.count - a.count))

// WebGL and the frame-by-frame camera stay local: none of it is state to share or serialize.
let globe: Globe | undefined
let resized = true
const camera = { ...DEFAULT_CAMERA }
let phi = camera.phi
let theta = camera.theta
let currentZoom = camera.zoom
const pointers = new Map<number, { x: number, y: number }>()
let pinchDistance = 0
const projection = { depth: 0, x: 0, y: 0 }
const markerElements = new Map<string, HTMLElement>()

function markerRef(code: string, element: unknown) {
  if (element instanceof HTMLElement) markerElements.set(code, element)
  else markerElements.delete(code)
}
const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value))
const angleDelta = (from: number, to: number) => ((to - from + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI

const palette = () => colorMode.value === 'dark'
  ? { dark: 1, diffuse: 1.2, mapBrightness: 4, mapBaseBrightness: 0.03, baseColor: [0.32, 0.36, 0.4] as [number, number, number], glowColor: [0.06, 0.08, 0.1] as [number, number, number] }
  : { dark: 0, diffuse: 1.4, mapBrightness: 8, mapBaseBrightness: 0, baseColor: [0.94, 0.95, 0.96] as [number, number, number], glowColor: [0.92, 0.93, 0.95] as [number, number, number] }

const size = useElementSize(container)
// Frames run only while the globe is on screen, in a visible tab, and moving.
const onScreen = useElementVisibility(container)
const tab = useDocumentVisibility()
const motion = usePreferredReducedMotion()
const still = computed(() => motion.value === 'reduce')
const { pause, resume } = useRafFn(({ delta }) => render(Math.min(delta, 64)), { immediate: false })

function schedule() {
  if (globe && onScreen.value && tab.value === 'visible') resume()
}
function render(elapsed: number) {
  const width = Math.max(1, Math.round(size.width.value))
  const height = Math.max(1, Math.round(size.height.value))
  const rotating = !paused.value && !pointers.size && !still.value
  if (rotating) camera.phi += elapsed * 0.00006
  const progress = still.value || pointers.size ? 1 : 1 - Math.exp(-elapsed / 110)
  phi += angleDelta(phi, camera.phi) * progress
  theta += (camera.theta - theta) * progress
  currentZoom += (camera.zoom - currentZoom) * progress
  const scale = Math.min(width, height) / height * 0.98 * currentZoom
  globe?.update({ phi, theta, scale, ...(resized ? { width, height } : {}) })
  resized = false

  // Markers are HTML on top of the canvas: hide the ones behind the globe, out of the frame, or over another.
  const occupied: Array<{ x: number, y: number, width: number }> = []
  for (const country of markers.value) {
    const element = markerElements.get(country.code)
    if (!element) continue
    projectOnGlobe(projection, country.location, phi, theta, scale)
    const x = width / 2 + projection.x * height / 2
    const y = height / 2 + projection.y * height / 2
    const markerWidth = avatars.value
      ? (country.code === props.selected ? 32 + (country.top.length - 1) * 24 : 32)
      : 20 + format(country.count).length * 7
    const wasVisible = element.dataset.visible === 'true'
    const front = projection.depth > (wasVisible ? 0.1 : 0.14)
    const fits = x > markerWidth / 2 && x < width - markerWidth / 2 && y > 20 && y < height - 20
    const gap = wasVisible ? 4 : 8
    const hasRoom = occupied.every(other => Math.abs(other.x - x) > (other.width + markerWidth) / 2 + gap || Math.abs(other.y - y) > 28 + gap)
    const show = front && fits && hasRoom
    if (show !== wasVisible) {
      element.dataset.visible = String(show)
      element.inert = !show
    }
    if (show || wasVisible) {
      const transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0) translate(-50%, -50%)`
      if (element.style.transform !== transform) element.style.transform = transform
    }
    if (show) occupied.push({ x, y, width: markerWidth })
  }
  const moving = Math.abs(angleDelta(phi, camera.phi)) > 0.0001 || Math.abs(theta - camera.theta) > 0.0001 || Math.abs(currentZoom - camera.zoom) > 0.0001
  // Paused and settled: no more frames until something moves.
  if (!rotating && !moving) pause()
}

function setZoom(value: number) {
  paused.value = true
  zoom.value = clamp(value, 1, MAX_ZOOM)
  camera.zoom = zoom.value
  schedule()
}
function reset() {
  paused.value = false
  Object.assign(camera, DEFAULT_CAMERA)
  zoom.value = DEFAULT_CAMERA.zoom
  emit('select', null)
  schedule()
}
function focusSelected() {
  const location = props.selected ? COUNTRIES[props.selected]?.location : undefined
  if (!location) return
  paused.value = true
  Object.assign(camera, faceOnGlobe(location), { zoom: Math.max(camera.zoom, 1.8) })
  zoom.value = camera.zoom
  schedule()
}

function pinch() {
  const [first, second] = [...pointers.values()]
  return first && second ? Math.hypot(first.x - second.x, first.y - second.y) : 0
}
function pointerDown(event: PointerEvent) {
  paused.value = true
  canvas.value?.setPointerCapture(event.pointerId)
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
  pinchDistance = pinch()
}
function pointerMove(event: PointerEvent) {
  const previous = pointers.get(event.pointerId)
  if (!previous) return
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
  if (pointers.size > 1) {
    const next = pinch()
    if (pinchDistance > 0) setZoom(camera.zoom * next / pinchDistance)
    pinchDistance = next
    return
  }
  // Slower when zoomed in: the same drag moves the same distance on screen.
  camera.phi += (event.clientX - previous.x) / (180 * camera.zoom)
  camera.theta = clamp(camera.theta + (event.clientY - previous.y) / (240 * camera.zoom), -1.45, 1.45)
  schedule()
}
function pointerEnd(event: PointerEvent) {
  pointers.delete(event.pointerId)
  if (canvas.value?.hasPointerCapture(event.pointerId)) canvas.value.releasePointerCapture(event.pointerId)
  pinchDistance = pinch()
}
const KEY_MOVES: Record<string, [number, number]> = { ArrowLeft: [-0.15, 0], ArrowRight: [0.15, 0], ArrowUp: [0, -0.15], ArrowDown: [0, 0.15] }
function keydown(event: KeyboardEvent) {
  const move = KEY_MOVES[event.key]
  if (move) {
    event.preventDefault()
    paused.value = true
    camera.phi += move[0]
    camera.theta = clamp(camera.theta + move[1], -1.45, 1.45)
    schedule()
  } else if (['+', '=', '-', '0'].includes(event.key)) {
    event.preventDefault()
    if (event.key === '0') reset()
    else setZoom(zoom.value + (event.key === '-' ? -0.25 : 0.25))
  }
}
function wheel(event: WheelEvent) {
  // Trackpad pinch is a Ctrl+wheel: a plain wheel keeps scrolling the page.
  if (!event.ctrlKey) return
  event.preventDefault()
  const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? size.height.value : 1)
  setZoom(camera.zoom * Math.exp(-delta * 0.01))
}
useEventListener(container, 'wheel', wheel, { passive: false })

watch([size.width, size.height], () => {
  resized = true
  schedule()
})
watch([onScreen, tab], () => {
  if (tab.value !== 'visible') pointers.clear()
  if (onScreen.value && tab.value === 'visible') schedule()
  else pause()
})
watch([markers, paused, avatars, still], schedule, { flush: 'post' })
watch(() => props.selected, focusSelected)
watch(() => colorMode.value, () => {
  globe?.update(palette())
  schedule()
})

onMounted(() => {
  if (!canvas.value) return
  try {
    if (!canvas.value.getContext('webgl2') && !canvas.value.getContext('webgl')) throw new Error('WebGL unavailable')
    globe = createGlobe(canvas.value, {
      width: 1,
      height: 1,
      devicePixelRatio: Math.min(devicePixelRatio || 1, innerWidth < 768 ? 1.5 : 2),
      phi,
      theta,
      scale: 0.98,
      mapSamples: 32000,
      markerColor: [0, 0.86, 0.51],
      markers: [],
      ...palette()
    })
  } catch {
    failed.value = true
    return
  }
  ready.value = true
  focusSelected()
  schedule()
})

onBeforeUnmount(() => {
  pause()
  globe?.destroy()
  globe = undefined
  markerElements.clear()
})
</script>

<template>
  <div ref="container" class="nuxters-globe relative size-full isolate" :data-ready="ready || undefined">
    <canvas
      v-show="!failed"
      ref="canvas"
      tabindex="0"
      role="img"
      aria-label="Nuxters around the world. Arrow keys rotate the globe, plus and minus zoom, zero resets. Every country is also in the list."
      class="block size-full cursor-grab active:cursor-grabbing touch-none rounded-full focus-visible:outline-2 focus-visible:outline-primary focus-visible:-outline-offset-4"
      @pointerdown="pointerDown"
      @pointermove="pointerMove"
      @pointerup="pointerEnd"
      @pointercancel="pointerEnd"
      @lostpointercapture="pointerEnd"
      @keydown="keydown"
      @webglcontextlost.prevent="failed = true; pause()"
    />

    <template v-if="ready && !failed">
      <button
        v-for="country in markers"
        :key="country.code"
        :ref="element => markerRef(country.code, element)"
        data-visible="false"
        inert
        type="button"
        class="nuxters-globe__marker"
        :class="{ 'is-selected': selected === country.code, 'is-avatars': avatars }"
        :aria-label="`${country.name}, ${format(country.count)} ${country.count === 1 ? 'Nuxter' : 'Nuxters'}`"
        :aria-pressed="selected === country.code"
        @click="emit('select', selected === country.code ? null : country.code)"
      >
        <Transition name="nuxters-globe-marker" mode="out-in" @after-enter="schedule">
          <span v-if="avatars" key="avatars" class="flex pl-2" aria-hidden="true">
            <NuxtImg
              v-for="username in country.code === selected ? country.top : country.top.slice(0, 1)"
              :key="username"
              :src="`/gh_avatar/${username}`"
              provider="ipx"
              densities="x1 x2"
              width="32"
              height="32"
              format="auto"
              loading="lazy"
              alt=""
              class="size-8 max-w-none -ml-2 rounded-full ring-2 ring-default object-cover"
            />
          </span>
          <span v-else key="count">{{ format(country.count) }}</span>
        </Transition>
      </button>
    </template>

    <p v-if="failed" class="absolute inset-[20%] grid place-content-center text-center text-sm text-muted" role="status">
      The globe needs WebGL. Every country is in the list.
    </p>

    <div v-if="ready && !failed" class="absolute left-0 bottom-0 flex gap-0.5 p-1 rounded-lg bg-default/80 ring ring-default backdrop-blur" role="group" aria-label="Globe controls">
      <UButton
        :icon="paused ? 'i-lucide-play' : 'i-lucide-pause'"
        :aria-label="paused ? 'Resume rotation' : 'Pause rotation'"
        :aria-pressed="paused"
        color="neutral"
        variant="ghost"
        size="sm"
        @click="paused = !paused"
      />
      <UButton
        icon="i-lucide-plus"
        aria-label="Zoom in"
        color="neutral"
        variant="ghost"
        size="sm"
        :disabled="zoom >= MAX_ZOOM"
        @click="setZoom(zoom + 0.25)"
      />
      <UButton
        icon="i-lucide-minus"
        aria-label="Zoom out"
        color="neutral"
        variant="ghost"
        size="sm"
        :disabled="zoom <= 1"
        @click="setZoom(zoom - 0.25)"
      />
      <UButton
        icon="i-lucide-rotate-ccw"
        aria-label="Reset the globe"
        color="neutral"
        variant="ghost"
        size="sm"
        @click="reset"
      />
    </div>
  </div>
</template>

<style scoped>
.nuxters-globe__marker {
  position: absolute;
  inset: 0 auto auto 0;
  display: flex;
  align-items: center;
  height: 28px;
  padding: 0 9px;
  border: 1px solid var(--ui-border-accented);
  border-radius: 999px;
  background: var(--ui-bg);
  color: var(--ui-text-highlighted);
  font: 600 11px/1 var(--font-sans);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 160ms ease-out, visibility 0s linear 160ms;
}
.nuxters-globe__marker[data-visible="true"] {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transition-delay: 0s;
}
.nuxters-globe__marker:hover,
.nuxters-globe__marker:focus-visible,
.nuxters-globe__marker.is-selected {
  z-index: 2;
  border-color: var(--ui-primary);
  outline: 2px solid color-mix(in oklab, var(--ui-primary) 35%, transparent);
  outline-offset: 2px;
}
.nuxters-globe__marker.is-avatars {
  height: 32px;
  padding: 0;
  border: 0;
  background: transparent;
}
.nuxters-globe-marker-enter-active,
.nuxters-globe-marker-leave-active {
  transition: opacity 120ms ease-out;
}
.nuxters-globe-marker-enter-from,
.nuxters-globe-marker-leave-to {
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .nuxters-globe__marker {
    transition-duration: 80ms, 0s;
    transition-delay: 0s, 80ms;
  }
  .nuxters-globe-marker-enter-active,
  .nuxters-globe-marker-leave-active {
    transition-duration: 0s;
  }
}
</style>
