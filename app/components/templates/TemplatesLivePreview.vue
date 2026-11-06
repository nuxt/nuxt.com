<script setup lang="ts">
import type { PreviewEditEvent, PreviewEvent, PreviewStep, Template } from '#shared/types'

export type LivePreviewStatus = 'booting' | 'mounting' | 'live' | 'failed'

const props = defineProps<{
  template: Template
}>()

const emit = defineEmits<{
  url: [url: string | undefined]
  status: [status: LivePreviewStatus, readyIn?: number]
}>()

const STEPS: Array<{ key: PreviewStep | 'mounted', pending: string, done: string }> = [
  { key: 'restored', pending: 'Loading the template', done: 'Template loaded' },
  { key: 'serving', pending: 'Starting the app', done: 'App started' },
  { key: 'mounted', pending: 'Opening it here', done: 'Ready to use' }
]

const colorMode = useColorMode()

const status = ref<LivePreviewStatus>('booting')
const preview = ref<{ id: string, url: string } | null>(null)
const error = ref('')
const startedAt = ref(0)
const now = ref(0)
const doneAt = ref<Partial<Record<PreviewStep | 'mounted', number>>>({})
const shared = useLivePreview()
interface Frame { id: number, url: string, src: string }
let frameIds = 0
const shown = shallowRef<Frame | null>(null)
/** Another server of the sandbox, or a reload of the same one, loading out of sight until it mounts and takes over. */
const pending = shallowRef<Frame | null>(null)
/** The previous frame stays under the new one while it fades in. Frame order never changes, since moving an iframe reloads it. */
const retiring = shallowRef<Frame | null>(null)
const frames = computed(() => [retiring.value, shown.value, pending.value].filter((frame): frame is Frame => !!frame))
const frameEls = new Map<number, HTMLIFrameElement>()

function load(url: string, path = '') {
  clearTimeout(promoteFallback)
  pending.value = { id: ++frameIds, url, src: `${url}${path}` }
}

/** The dev server's page failed to fetch some of its modules: loading it again only fetches the ones the browser missed. */
let bootRetries = 0
function retry(frame: Frame) {
  if (bootRetries >= 3 || (frame === shown.value && pending.value)) return
  bootRetries++
  load(frame.url, frame === shown.value ? shared.preview.value?.path ?? '' : frame.src.slice(frame.url.length))
}

const current = computed(() => STEPS.findIndex(step => !doneAt.value[step.key]))
const stepLabel = computed(() => current.value === -1 ? STEPS.at(-1)!.done : `${STEPS[current.value]!.pending}…`)
const seconds = (at: number) => ((at - startedAt.value) / 1000).toFixed(1)

watch(status, value => emit('status', value, value === 'live' && doneAt.value.mounted ? doneAt.value.mounted - startedAt.value : undefined))

let ticker: ReturnType<typeof setInterval> | undefined
let fallback: ReturnType<typeof setTimeout> | undefined
let controller: AbortController | undefined

function mark(step: PreviewStep | 'mounted') {
  doneAt.value = { ...doneAt.value, [step]: Date.now() }
}

/** Set once the visitor clicks into the frame: a swap now could drop them on another page, so `url` events wait for an explicit `serveFrom`. */
let touched = false
/** A route to open once the pending frame takes over. */
let pendingPath: string | null = null
let promoteFallback: ReturnType<typeof setTimeout> | undefined

function handle(data: PreviewEvent) {
  if (data.type === 'step') return mark(data.step)
  if (data.type === 'error') throw new Error(data.message)
  if (data.type === 'url') {
    if (!touched) load(data.url)
    return
  }
  preview.value = { id: data.id, url: data.url }
  shown.value = { id: ++frameIds, url: data.url, src: data.url }
  status.value = 'mounting'
  emit('url', data.url)
}

async function start() {
  stop()
  status.value = 'booting'
  error.value = ''
  doneAt.value = {}
  startedAt.value = now.value = Date.now()
  ticker = setInterval(() => now.value = Date.now(), 100)
  controller = new AbortController()

  try {
    const response = await fetch('/api/templates/preview', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ slug: props.template.slug }),
      signal: controller.signal
    })
    await readEvents(response, handle, 'The preview could not start.')
    if (!preview.value) throw new Error('The preview could not start.')
  } catch (err: any) {
    if (err?.name === 'AbortError') return
    status.value = 'failed'
    error.value = visitorMessage(err, 'The preview could not start.')
    clearInterval(ticker)
  }
}

/** Reads an NDJSON stream of events, or throws the error a failed request answered with. */
async function readEvents<T>(response: Response, onEvent: (event: T) => void, fallbackMessage: string) {
  if (!response.ok || !response.body) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.message || fallbackMessage)
  }
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader()
  let buffer = ''
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += value
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''
    for (const line of lines) if (line.trim()) onEvent(JSON.parse(line))
  }
}

// A response that isn't the expected stream would otherwise show the parser's message.
function visitorMessage(err: any, fallback: string) {
  return err instanceof SyntaxError ? fallback : err?.message || fallback
}

/** The dev server's frame is loading out of sight: the swap that follows ends the edit startup. */
let switchingToDev = false
let editController: AbortController | undefined
/** Briefly outlines the frame once the dev server takes over, or reloads after a restart. */
const handedOver = ref(false)
function flash() {
  handedOver.value = true
  setTimeout(() => handedOver.value = false, 900)
}

async function startEditing() {
  if (!preview.value || status.value !== 'live') return
  editController?.abort()
  editController = new AbortController()
  shared.editor.value = 'starting'
  shared.editError.value = ''
  shared.editStep.value = 0

  try {
    const response = await fetch(`/api/templates/preview/${preview.value.id}/edit`, { method: 'POST', signal: editController.signal })
    let devUrl: string | undefined
    await readEvents<PreviewEditEvent>(response, (data) => {
      if (data.type === 'error') throw new Error(data.message)
      shared.editStep.value = data.type === 'started' ? 1 : 2
      if (data.type === 'ready') devUrl = data.url
    }, 'The dev server could not start.')
    if (!devUrl) throw new Error('The dev server could not start.')
    // The visitor asked for it: swap even after they clicked into the frame, and keep them on their page.
    switchingToDev = true
    pendingPath = shared.preview.value?.path ?? null
    load(devUrl)
  } catch (err: any) {
    if (err?.name === 'AbortError') return
    shared.editor.value = 'failed'
    shared.editError.value = visitorMessage(err, 'The dev server could not start.')
  }
}

watch(() => shared.editRequest.value, startEditing)

// Installing a module restarts `nuxt dev`, and a page open during the restart stays broken. The new page loads under the
// current one and takes over once it mounts, so the visitor never watches it load unstyled.
let reloading = false
/** An edit can land while the dev server's first page loads: that page may render the old version, so it reloads once it takes over. */
let reloadAfterSwitch = false
watch(() => shared.reloadRequest.value, reload)
function reload() {
  if (!preview.value || status.value !== 'live') return
  if (switchingToDev) {
    reloadAfterSwitch = true
    return
  }
  reloading = true
  shared.activity.value = { id: 'reload', label: 'Loading the new version', state: 'running' }
  load(preview.value.url, shared.preview.value?.path ?? '')
}

/** Nuxi's change stays on screen a moment after it lands. */
let activityTimer: ReturnType<typeof setTimeout> | undefined
watch(() => shared.activity.value, (activity) => {
  clearTimeout(activityTimer)
  if (activity && activity.state !== 'running') activityTimer = setTimeout(() => shared.activity.value = null, 2500)
})

function mounted() {
  if (status.value !== 'mounting') return
  mark('mounted')
  status.value = 'live'
  clearInterval(ticker)
  clearTimeout(fallback)
  syncColorMode()
  if (preview.value) shared.preview.value = { ...preview.value, template: { slug: props.template.slug, name: props.template.name } }
}

function promote() {
  clearTimeout(promoteFallback)
  if (!preview.value || !pending.value) return
  bootRetries = 0
  const previous = shown.value
  retiring.value = previous
  shown.value = pending.value
  pending.value = null
  preview.value = { ...preview.value, url: shown.value.url }
  if (shared.preview.value) shared.preview.value = { ...shared.preview.value, url: preview.value.url }
  emit('url', preview.value.url)
  syncColorMode()
  if (pendingPath) navigate(pendingPath)
  pendingPath = null
  setTimeout(() => {
    if (retiring.value === previous) retiring.value = null
  }, 500)
  if (switchingToDev) {
    switchingToDev = false
    shared.editStep.value = 3
    shared.editor.value = 'on'
    flash()
  }
  if (reloading) {
    reloading = false
    shared.activity.value = { id: 'reload', label: 'Preview updated', state: 'done' }
    flash()
  }
  if (reloadAfterSwitch) {
    reloadAfterSwitch = false
    reload()
  }
}

function navigate(path: string) {
  if (!shown.value) return
  frameEls.get(shown.value.id)?.contentWindow?.postMessage({ source: 'nuxt.com', type: 'navigate', value: path }, new URL(shown.value.url).origin)
}

watch(() => shared.preview.value?.url, (url) => {
  if (url && preview.value && url !== preview.value.url) load(url)
})

watch(() => shared.navigation.value?.id, () => {
  const path = shared.navigation.value?.path
  if (!path) return
  if (pending.value) pendingPath = path
  else navigate(path)
})

function onIframeLoad(frame: Frame) {
  // Snapshots built before the bridge plugin never post `ready`. The dev server always has it, and its first page can take
  // well over 3s past `load` to fetch its modules one import level at a time: swapping earlier shows a page that never starts.
  // A page that fails to fetch them reports it and loads again, so the dev server's wait only covers one that hangs.
  if (frame === pending.value) promoteFallback = setTimeout(promote, switchingToDev || shared.editor.value === 'on' ? 25_000 : 3000)
  else if (frame === shown.value) fallback = setTimeout(mounted, 1500)
}

function setFrame(id: number, el: unknown) {
  if (el) frameEls.set(id, el as HTMLIFrameElement)
  else frameEls.delete(id)
}

function stop() {
  clearInterval(ticker)
  clearTimeout(fallback)
  clearTimeout(promoteFallback)
  controller?.abort()
  editController?.abort()
  clearTimeout(activityTimer)
  switchingToDev = false
  reloading = false
  reloadAfterSwitch = false
  bootRetries = 0
  shared.editor.value = 'off'
  shared.editStep.value = 0
  shared.editError.value = ''
  shared.activity.value = null
  if (preview.value) {
    fetch(`/api/templates/preview/${preview.value.id}`, { method: 'DELETE', keepalive: true }).catch(() => {})
  }
  preview.value = null
  shown.value = null
  pending.value = null
  retiring.value = null
  pendingPath = null
  touched = false
  shared.preview.value = null
  emit('url', undefined)
}

function syncColorMode() {
  for (const frame of frames.value) {
    frameEls.get(frame.id)?.contentWindow?.postMessage({ source: 'nuxt.com', type: 'color-mode', value: colorMode.value }, new URL(frame.url).origin)
  }
}

watch(() => colorMode.value, syncColorMode)

useEventListener(import.meta.client ? window : undefined, 'message', (event: MessageEvent) => {
  if (event.data?.source !== 'nuxt-com-preview') return
  // A reload shares its origin with the frame it replaces: only the sending window tells them apart.
  const from = frames.value.find(frame => frameEls.get(frame.id)?.contentWindow === event.source)
  if (!from || event.origin !== new URL(from.url).origin) return
  if (event.data.type === 'boot-failed') return retry(from)
  if (from === pending.value) {
    if (event.data.type === 'ready') promote()
    // A page that crashed is still the page the dev server serves now: show it, so Nuxi and the visitor see the error.
    if (event.data.type === 'error') {
      promote()
      if (shared.preview.value) shared.preview.value = { ...shared.preview.value, error: event.data.message }
    }
    return
  }
  if (from !== shown.value) return
  if (event.data.type === 'ready') mounted()
  // A path, never a host: it's appended to the sandbox URL in the address bar and the "Open in new tab" link.
  if (event.data.type === 'route' && typeof event.data.message === 'string' && event.data.message.startsWith('/') && shared.preview.value) {
    shared.preview.value = { ...shared.preview.value, path: event.data.message }
  }
  if (event.data.type === 'error') {
    // Once the app is up, a crash only breaks one page: keep it open and expose the error.
    if (status.value === 'live') {
      if (shared.preview.value) shared.preview.value = { ...shared.preview.value, error: event.data.message }
      return
    }
    stop()
    status.value = 'failed'
    error.value = `${props.template.name} crashed while starting: ${event.data.message}`
  }
})
// Focus moving into a frame is the only sign of a click inside it, since frames are cross-origin.
useEventListener(import.meta.client ? window : undefined, 'blur', () => {
  if (document.activeElement?.tagName === 'IFRAME') touched = true
})
useEventListener(import.meta.client ? window : undefined, 'pagehide', stop)
// Back from the back/forward cache, `pagehide` already stopped the sandbox.
useEventListener(import.meta.client ? window : undefined, 'pageshow', (event: PageTransitionEvent) => {
  if (!event.persisted || status.value === 'failed') return
  status.value = 'failed'
  error.value = 'The preview stopped when you left the page.'
})
onMounted(start)
onBeforeUnmount(stop)
</script>

<template>
  <div class="absolute inset-0">
    <iframe
      v-for="frame in (preview && status !== 'failed' ? frames : [])"
      :key="frame.id"
      :ref="el => setFrame(frame.id, el)"
      :src="frame.src"
      :title="`${template.name} live preview`"
      class="absolute inset-0 size-full bg-default transition-[opacity,filter] duration-500 ease-snappy"
      :class="frame === pending ? 'opacity-0 pointer-events-none' : status === 'live' ? 'opacity-100 blur-none' : 'opacity-0 blur-sm pointer-events-none'"
      :aria-hidden="frame !== shown"
      @load="onIframeLoad(frame)"
    />

    <Transition
      enter-from-class="opacity-0 translate-y-1 scale-[0.98]"
      enter-active-class="transition-[opacity,translate,scale] duration-200 ease-snappy"
      leave-active-class="transition-[opacity,scale] duration-200 ease-snappy"
      leave-to-class="opacity-0 scale-[0.98]"
    >
      <div v-if="status !== 'live'" class="absolute inset-0 flex items-center justify-center p-6">
        <div class="w-full rounded-xl bg-default/80 backdrop-blur-xl ring ring-default shadow-xl shadow-black/10 p-3.5 flex flex-col gap-2.5" :class="status === 'failed' ? 'max-w-sm' : 'max-w-xs'" role="status" aria-live="polite">
          <template v-if="status === 'booting' || status === 'mounting'">
            <div class="flex items-baseline justify-between gap-3">
              <p class="text-sm font-medium text-highlighted truncate">
                Starting {{ template.name }}
              </p>
              <span class="font-mono text-xs text-muted tabular-nums">{{ seconds(now) }}s</span>
            </div>
            <div class="grid grid-cols-3 gap-1" aria-hidden="true">
              <span
                v-for="(step, index) in STEPS"
                :key="step.key"
                class="h-1 rounded-full transition-colors duration-300"
                :class="doneAt[step.key] ? 'bg-primary' : index === current ? 'bg-primary/40 animate-pulse' : 'bg-accented'"
              />
            </div>
            <div class="flex items-center justify-between gap-3">
              <p class="text-xs text-muted truncate">
                {{ stepLabel }}
              </p>
              <TemplatesPoweredBy class="shrink-0 text-[10px] text-dimmed" />
            </div>
          </template>

          <div v-else class="flex items-center gap-3">
            <UIcon name="i-lucide-circle-x" class="size-4 shrink-0 text-error" />
            <p class="flex-1 text-sm text-muted text-pretty">
              {{ error }}
            </p>
            <UButton
              label="Try Again"
              color="neutral"
              variant="subtle"
              size="sm"
              icon="i-lucide-rotate-ccw"
              class="shrink-0 ring-default"
              @click="start"
            />
          </div>
        </div>
      </div>
    </Transition>

    <div
      class="pointer-events-none absolute inset-0 ring-2 ring-inset ring-primary/70 transition-opacity ease-snappy"
      :class="handedOver ? 'opacity-100 duration-150' : 'opacity-0 duration-700'"
      aria-hidden="true"
    />
  </div>
</template>

<style scoped>
@media (prefers-reduced-motion: reduce) {
  .animate-spin { animation-duration: 1.5s; }
  iframe { filter: none !important; }
}
</style>
