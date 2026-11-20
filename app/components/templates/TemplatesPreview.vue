<script setup lang="ts">
import type { Template, TemplateHealth } from '#shared/types'
import type { LivePreviewStatus } from './TemplatesLivePreview.vue'

const props = defineProps<{
  template: Template
  health?: TemplateHealth
}>()

const live = ref(false)
const liveUrl = ref<string>()
const status = ref<LivePreviewStatus>()
const readyIn = ref<number>()
const device = ref<'desktop' | 'mobile'>('desktop')

const { preview: livePreview, editor, reloadRequest, stopsAt, startEditing, download } = useLivePreview()
const { open: openNuxi } = useNuxtAgent()
const { track } = useAnalytics()
const toast = useToast()

function editWithNuxi() {
  track('Template Action', { template: props.template.name, action: 'Edit with Nuxi' })
  startEditing()
  openNuxi()
}

const image = computed(() => templateImage(props.template))
const canGoLive = computed(() => canLivePreview(props.template) && !!props.health?.check?.live)
const booting = computed(() => live.value && status.value !== 'live')
const livePage = computed(() => liveUrl.value && `${liveUrl.value}${livePreview.value?.path ?? ''}`)
const address = computed(() => (live.value ? livePage.value || 'Starting the preview…' : props.template.demo || templateRepoUrl(props.template))?.replace(/^https?:\/\//, '').replace(/\/$/, ''))
const ADDRESS_ACTION = 'size-6 rounded-full flex items-center justify-center text-dimmed transition-[color,background-color,scale] duration-150 ease-snappy hover:text-highlighted hover:bg-elevated active:scale-90 focus-visible:outline-2 focus-visible:outline-primary'

/** The host reads quieter than the route, like a browser's address bar. */
const addressParts = computed(() => {
  const value = address.value ?? ''
  const slash = value.indexOf('/')
  return slash === -1 ? { host: value, path: '' } : { host: value.slice(0, slash), path: value.slice(slash) }
})
const openUrl = computed(() => live.value ? livePage.value : props.template.demo)

/** When the sandbox stops: an estimate until the server reports it, then moved by each extension. */
const expiresAt = ref(0)
const canExtend = ref(true)
const extending = ref(false)
const now = useNow({ interval: 1000 })
const remaining = computed(() => Math.max(0, expiresAt.value - now.value.getTime()))
const countdown = computed(() => {
  const seconds = Math.ceil(remaining.value / 1000)
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
})
/** Warns before the sandbox stops, so a visitor editing it can keep it running or download their changes first. */
const EXPIRY_WARNING_MS = 2 * 60_000
const EXPIRY_TOAST = 'live-preview-expiry'
/** The stop time the visitor was last warned about: an extension moves it, so they are warned again before the new one. */
let warnedFor = 0
// An extension in flight at zero may have reached the server: its response decides, and a failed one stops the preview then.
watch([remaining, extending], ([value]) => {
  if (!live.value || status.value !== 'live') return
  if (value === 0) {
    if (extending.value) return
    stop()
    toast.add({ title: 'Your live preview stopped', description: 'Its time ran out. Start it again to keep trying the template.', icon: 'i-lucide-timer-off', color: 'neutral' })
  } else if (value <= EXPIRY_WARNING_MS && warnedFor !== expiresAt.value) {
    warnedFor = expiresAt.value
    toast.add({
      id: EXPIRY_TOAST,
      title: 'Your live preview is about to stop',
      description: canExtend.value ? 'Keep it running to continue, or download the project.' : 'It can\'t run any longer: download the project to keep your changes.',
      icon: 'i-lucide-timer',
      color: 'warning',
      duration: 0,
      actions: [
        ...(canExtend.value ? [{ label: `Add ${PREVIEW_TIMEOUT_MS / 60_000} minutes`, icon: 'i-lucide-clock-plus', onClick: extend }] : []),
        { label: 'Download ZIP', icon: 'i-lucide-download', color: 'neutral' as const, variant: 'outline' as const, closeOnClick: false, onClick: downloadZip }
      ]
    })
  }
})

function resetTimer() {
  expiresAt.value = Date.now() + PREVIEW_TIMEOUT_MS
  canExtend.value = true
}
// A deploy keeps the sandbox running until it ends: the countdown follows, so it never stops the preview mid-deploy.
/** The latest a deploy keeps the current preview running, or 0. */
const deployStopsAt = () => stopsAt.value && stopsAt.value.id === livePreview.value?.id ? stopsAt.value.at : 0
watch(stopsAt, () => live.value && (expiresAt.value = Math.max(expiresAt.value, deployStopsAt())))

function downloadZip() {
  track('Template Action', { template: props.template.name, action: 'Download ZIP' })
  download()
}

function start() {
  track('Template Action', { template: props.template.name, action: 'Try Live Preview' })
  resetTimer()
  live.value = true
}

function onStatus(value: LivePreviewStatus, ms?: number) {
  // "Try Again" boots a new sandbox, with a new timeout.
  if (value === 'booting') resetTimer()
  status.value = value
  if (ms) readyIn.value = ms
}

async function extend() {
  if (!livePreview.value || extending.value) return
  const id = livePreview.value.id
  // A response for a preview that stopped, or was replaced, must not move the current one's deadline.
  const current = () => live.value && livePreview.value?.id === id
  extending.value = true
  try {
    const result = await $fetch<{ expiresAt: number, canExtend: boolean }>(`/api/templates/preview/${id}/extend`, { method: 'POST' })
    if (!current()) return
    // An extension capped by the preview's lifetime can end before a deploy running now: the deploy's deadline wins.
    expiresAt.value = Math.max(result.expiresAt, deployStopsAt())
    canExtend.value = result.canExtend
    toast.remove(EXPIRY_TOAST)
    track('Template Action', { template: props.template.name, action: 'Extend Live Preview' })
  } catch (error: any) {
    if (!current()) return
    if (error?.statusCode === 409) canExtend.value = false
    toast.add({ title: 'Could not extend the preview', description: error?.data?.message || 'Please try again.', color: 'error' })
  } finally {
    extending.value = false
  }
}

// The warning stays open until dismissed: leaving the page stops the preview, so it goes too.
onBeforeUnmount(() => toast.remove(EXPIRY_TOAST))

function stop() {
  toast.remove(EXPIRY_TOAST)
  live.value = false
  liveUrl.value = undefined
  status.value = undefined
  readyIn.value = undefined
  device.value = 'desktop'
}
</script>

<template>
  <div class="rounded-xl bg-elevated/40 ring ring-default p-1 shadow-xs">
    <div class="h-9 ps-2.5 pe-1 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
      <div class="min-w-0 flex items-center gap-2 text-xs">
        <template v-if="live">
          <span class="relative flex size-2 shrink-0">
            <span v-if="status === 'live'" class="absolute inset-0 rounded-full bg-success/60 motion-safe:animate-ping [animation-iteration-count:2]" />
            <span
              class="relative size-2 rounded-full transition-colors duration-300"
              :class="status === 'live' ? 'bg-success' : status === 'failed' ? 'bg-error' : 'bg-warning motion-safe:animate-pulse'"
            />
          </span>
          <span class="font-medium text-highlighted">{{ status === 'live' ? 'Live' : status === 'failed' ? 'Stopped' : 'Starting' }}</span>
          <UTooltip
            v-if="status === 'live'"
            :text="`${readyIn ? `Ready in ${(readyIn / 1000).toFixed(1)}s. ` : ''}This preview closes on its own when the timer runs out.`"
            :ui="{ content: 'max-w-xs h-auto py-1.5', text: 'whitespace-normal text-pretty' }"
          >
            <span class="hidden sm:inline font-mono text-muted tabular-nums cursor-default" :class="remaining < 60_000 && 'text-warning'">{{ countdown }} left</span>
          </UTooltip>
          <UTooltip v-if="status === 'live' && canExtend" :text="`Add ${PREVIEW_TIMEOUT_MS / 60_000} minutes`">
            <UButton
              icon="i-lucide-clock-plus"
              :aria-label="`Keep the preview running ${PREVIEW_TIMEOUT_MS / 60_000} minutes longer`"
              color="neutral"
              variant="ghost"
              size="xs"
              class="hidden sm:inline-flex size-6 justify-center text-dimmed hover:text-muted"
              :class="remaining < 60_000 && 'text-warning hover:text-warning'"
              :ui="{ leadingIcon: 'size-3.5' }"
              :loading="extending"
              @click="extend"
            />
          </UTooltip>
        </template>
      </div>

      <div class="min-w-0 flex justify-center">
        <div class="min-w-0 w-full max-w-sm h-7 ps-2.5 pe-0.5 flex items-center gap-1.5 rounded-full bg-default ring ring-default text-xs">
          <UIcon :name="live ? 'i-lucide-globe' : 'i-lucide-lock'" class="size-3.5 shrink-0 text-dimmed" />
          <span class="min-w-0 flex-1 truncate font-mono">
            <span class="text-muted">{{ addressParts.host }}</span><span class="text-highlighted">{{ addressParts.path }}</span>
          </span>
          <UTooltip v-if="live && editor === 'on'" text="Running nuxt dev: edits show live">
            <span class="shrink-0 px-1.5 rounded-full bg-primary/10 text-primary font-mono text-[10px] leading-4 cursor-default">dev</span>
          </UTooltip>
          <div class="shrink-0 flex items-center">
            <UTooltip v-if="live && status === 'live'" text="Reload">
              <button type="button" aria-label="Reload the preview" :class="ADDRESS_ACTION" @click="reloadRequest++">
                <UIcon name="i-lucide-rotate-cw" class="size-3.5" />
              </button>
            </UTooltip>
            <UTooltip v-if="openUrl" text="Open in New Tab">
              <a
                :href="openUrl"
                target="_blank"
                rel="noopener"
                aria-label="Open in new tab"
                :class="ADDRESS_ACTION"
                @click="!live && track('Template Action', { template: template.name, action: 'Open Demo' })"
              >
                <UIcon name="i-lucide-arrow-up-right" class="size-3.5" />
              </a>
            </UTooltip>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-end gap-0.5">
        <template v-if="live && status === 'live'">
          <UTooltip :text="device === 'mobile' ? 'Desktop View' : 'Mobile View'">
            <UButton
              :icon="device === 'mobile' ? 'i-lucide-monitor' : 'i-lucide-smartphone'"
              :aria-label="device === 'mobile' ? 'Show desktop view' : 'Show mobile view'"
              color="neutral"
              variant="ghost"
              size="xs"
              class="hidden sm:inline-flex"
              @click="device = device === 'mobile' ? 'desktop' : 'mobile'"
            />
          </UTooltip>
          <UTooltip text="Edit with Nuxi">
            <UButton
              icon="i-custom-nuxi"
              aria-label="Edit with Nuxi"
              color="neutral"
              variant="ghost"
              size="xs"
              @click="editWithNuxi"
            />
          </UTooltip>
        </template>
        <button
          v-if="live"
          type="button"
          aria-label="Stop live preview"
          class="group ms-1 me-0.5 h-6 ps-2 pe-2.5 flex items-center gap-1.5 rounded-full bg-error/10 ring ring-error/25 text-xs font-medium text-error transition-[background-color,scale] duration-150 ease-snappy hover:bg-error/15 active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-error"
          @click="stop"
        >
          <span class="size-2 rounded-[2px] bg-current transition-transform duration-150 ease-snappy group-hover:scale-110" />
          Stop
        </button>
      </div>
    </div>

    <div class="relative aspect-video overflow-hidden rounded-lg ring ring-default bg-default">
      <NuxtImg
        v-if="image"
        :src="image"
        :alt="`${template.name} screenshot`"
        class="absolute inset-0 size-full object-cover object-top transition-[opacity,filter,scale] duration-500 ease-snappy"
        :class="[
          booting && 'blur-md scale-[1.03] opacity-60',
          live && status === 'live' && device === 'mobile' && 'opacity-0'
        ]"
        width="1600"
        height="900"
        format="webp"
      />
      <div
        v-else
        class="absolute inset-0 flex items-center justify-center bg-[radial-gradient(var(--ui-border)_1px,transparent_1px)] bg-[length:16px_16px] transition-opacity duration-300"
        :class="live && 'opacity-40'"
      >
        <UIcon v-if="!canGoLive" :name="template.icon || 'i-lucide-app-window'" class="size-10 text-dimmed" />
      </div>

      <Transition leave-active-class="transition-opacity duration-200 ease-snappy" leave-to-class="opacity-0">
        <div
          v-if="live"
          class="absolute inset-y-0 left-1/2 -translate-x-1/2 transition-[width] duration-300 ease-snappy"
          :class="device === 'mobile' ? 'w-[390px] max-w-full border-x border-default' : 'w-full'"
        >
          <NuxtErrorBoundary @error="onStatus('failed')">
            <LazyTemplatesLivePreview :template="template" @url="liveUrl = $event" @status="onStatus" @expires="expiresAt = $event" />
            <template #error>
              <div class="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6" role="alert">
                <p class="text-sm text-highlighted">
                  The preview could not load.
                </p>
                <UButton label="Reload page" color="neutral" variant="subtle" icon="i-lucide-rotate-ccw" @click="reloadNuxtApp()" />
              </div>
            </template>
          </NuxtErrorBoundary>
        </div>
      </Transition>

      <TemplatesPreviewIsland :active="live && status === 'live'" />

      <Transition
        enter-from-class="opacity-0 translate-y-2"
        enter-active-class="transition-[opacity,translate] duration-300 ease-snappy"
        leave-active-class="transition-[opacity,translate] duration-150 ease-snappy"
        leave-to-class="opacity-0 translate-y-1"
      >
        <div
          v-if="canGoLive && !live"
          class="absolute inset-x-0 bottom-0 p-4 sm:p-6 flex justify-center"
          :class="image ? 'pt-24 bg-linear-to-t from-black/35 to-transparent' : 'top-0 items-center'"
        >
          <div class="flex items-center gap-3 rounded-full bg-default/80 backdrop-blur-xl ring ring-default shadow-lg shadow-black/10 p-1 sm:pe-4">
            <UButton
              label="Try It Live"
              icon="i-lucide-play"
              class="rounded-full px-3.5 transition-transform duration-150 ease-snappy active:scale-[0.97]"
              @click="start"
            />
            <span class="hidden sm:inline text-xs text-muted">A real Nuxt app, right in your browser</span>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>
