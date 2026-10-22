<script setup lang="ts">
import type { PreviewEvent, PreviewStep, Template } from '#shared/types'

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
/** Another server of the sandbox, loading in a hidden frame until it mounts and takes over. */
const pendingUrl = ref<string | null>(null)
/** The previous frame stays under the new one while it fades in. Frame order never changes, since moving an iframe reloads it. */
const retiringUrl = ref<string | null>(null)
const frames = computed(() => [retiringUrl.value, preview.value?.url, pendingUrl.value].filter((url): url is string => !!url))
const frameEls = new Map<string, HTMLIFrameElement>()

const current = computed(() => STEPS.findIndex(step => !doneAt.value[step.key]))
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
    if (!touched) pendingUrl.value = data.url
    return
  }
  preview.value = { id: data.id, url: data.url }
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
    if (!response.ok || !response.body) {
      const body = await response.json().catch(() => null)
      throw new Error(body?.message || 'The preview could not start.')
    }

    const reader = response.body.pipeThrough(new TextDecoderStream()).getReader()
    let buffer = ''
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += value
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      for (const line of lines) if (line.trim()) handle(JSON.parse(line))
    }
    if (!preview.value) throw new Error('The preview could not start.')
  } catch (err: any) {
    if (err?.name === 'AbortError') return
    status.value = 'failed'
    error.value = err?.message || 'The preview could not start.'
    clearInterval(ticker)
  }
}

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
  if (!preview.value || !pendingUrl.value) return
  retiringUrl.value = preview.value.url
  preview.value = { ...preview.value, url: pendingUrl.value }
  pendingUrl.value = null
  if (shared.preview.value) shared.preview.value = { ...shared.preview.value, url: preview.value.url }
  emit('url', preview.value.url)
  syncColorMode()
  if (pendingPath) navigate(pendingPath)
  pendingPath = null
  setTimeout(() => retiringUrl.value = null, 400)
}

function navigate(path: string) {
  if (!preview.value) return
  frameEls.get(preview.value.url)?.contentWindow?.postMessage({ source: 'nuxt.com', type: 'navigate', value: path }, new URL(preview.value.url).origin)
}

watch(() => shared.preview.value?.url, (url) => {
  if (url && preview.value && url !== preview.value.url) pendingUrl.value = url
})

watch(() => shared.navigation.value?.id, () => {
  const path = shared.navigation.value?.path
  if (!path) return
  if (pendingUrl.value) pendingPath = path
  else navigate(path)
})

function onIframeLoad(url: string) {
  // Snapshots built before the bridge plugin never post `ready`.
  if (url === pendingUrl.value) promoteFallback = setTimeout(promote, 3000)
  else if (url === preview.value?.url) fallback = setTimeout(mounted, 1500)
}

function setFrame(url: string, el: unknown) {
  if (el) frameEls.set(url, el as HTMLIFrameElement)
  else frameEls.delete(url)
}

function stop() {
  clearInterval(ticker)
  clearTimeout(fallback)
  clearTimeout(promoteFallback)
  controller?.abort()
  if (preview.value) {
    fetch(`/api/templates/preview/${preview.value.id}`, { method: 'DELETE', keepalive: true }).catch(() => {})
  }
  preview.value = null
  pendingUrl.value = null
  retiringUrl.value = null
  pendingPath = null
  touched = false
  shared.preview.value = null
  emit('url', undefined)
}

function syncColorMode() {
  for (const url of frames.value) {
    frameEls.get(url)?.contentWindow?.postMessage({ source: 'nuxt.com', type: 'color-mode', value: colorMode.value }, new URL(url).origin)
  }
}

watch(() => colorMode.value, syncColorMode)

useEventListener(import.meta.client ? window : undefined, 'message', (event: MessageEvent) => {
  if (event.data?.source !== 'nuxt-com-preview') return
  if (pendingUrl.value && event.origin === new URL(pendingUrl.value).origin) {
    if (event.data.type === 'ready') promote()
    return
  }
  if (!preview.value || event.origin !== new URL(preview.value.url).origin) return
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
      v-for="url in (preview && status !== 'failed' ? frames : [])"
      :key="url"
      :ref="el => setFrame(url, el)"
      :src="url"
      :title="`${template.name} live preview`"
      class="absolute inset-0 size-full bg-default transition-[opacity,filter] duration-500 ease-snappy"
      :class="url === pendingUrl ? 'opacity-0 pointer-events-none' : status === 'live' ? 'opacity-100 blur-none' : 'opacity-0 blur-sm pointer-events-none'"
      :aria-hidden="url !== preview?.url"
      @load="onIframeLoad(url)"
    />

    <Transition
      enter-from-class="opacity-0 translate-y-1 scale-[0.98]"
      enter-active-class="transition-[opacity,translate,scale] duration-200 ease-snappy"
      leave-active-class="transition-[opacity,scale] duration-200 ease-snappy"
      leave-to-class="opacity-0 scale-[0.98]"
    >
      <div v-if="status !== 'live'" class="absolute inset-0 flex items-center justify-center p-6">
        <div class="w-full max-w-xs rounded-xl bg-default/80 backdrop-blur-xl ring ring-default shadow-xl shadow-black/10 p-4 flex flex-col gap-3" role="status" aria-live="polite">
          <template v-if="status === 'booting' || status === 'mounting'">
            <div class="flex items-baseline justify-between gap-3">
              <p class="text-sm font-medium text-highlighted truncate">
                Starting {{ template.name }}
              </p>
              <span class="font-mono text-xs text-muted tabular-nums">{{ seconds(now) }}s</span>
            </div>
            <ol class="flex flex-col gap-2">
              <li
                v-for="(step, index) in STEPS"
                :key="step.key"
                class="flex items-center gap-2.5 text-xs transition-colors duration-200"
                :class="doneAt[step.key] ? 'text-default' : index === current ? 'text-highlighted' : 'text-dimmed'"
              >
                <span class="relative size-4 shrink-0 flex items-center justify-center">
                  <UIcon v-if="doneAt[step.key]" name="i-lucide-check" class="size-3.5 text-primary" />
                  <span v-else-if="index === current" class="size-3 rounded-full border-[1.5px] border-current border-t-transparent animate-spin" />
                  <span v-else class="size-1.5 rounded-full bg-current" />
                </span>
                <span class="flex-1 truncate">{{ doneAt[step.key] ? step.done : step.pending }}</span>
                <span v-if="doneAt[step.key]" class="font-mono text-muted tabular-nums">{{ seconds(doneAt[step.key]!) }}s</span>
              </li>
            </ol>
          </template>

          <template v-else>
            <div class="flex items-start gap-2.5">
              <UIcon name="i-lucide-circle-x" class="size-4 mt-0.5 shrink-0 text-error" />
              <p class="text-sm text-muted text-pretty">
                {{ error }}
              </p>
            </div>
            <UButton
              label="Try Again"
              color="neutral"
              variant="subtle"
              size="sm"
              icon="i-lucide-rotate-ccw"
              class="self-start ring-default"
              @click="start"
            />
          </template>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
@media (prefers-reduced-motion: reduce) {
  .animate-spin { animation-duration: 1.5s; }
  iframe { filter: none !important; }
}
</style>
