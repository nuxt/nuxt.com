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

const { preview: livePreview } = useLivePreview()
const { track } = useAnalytics()

const image = computed(() => templateImage(props.template))
const canGoLive = computed(() => canLivePreview(props.template) && !!props.health?.check?.live)
const booting = computed(() => live.value && status.value !== 'live')
const livePage = computed(() => liveUrl.value && `${liveUrl.value}${livePreview.value?.path ?? ''}`)
const address = computed(() => (live.value ? livePage.value || 'Starting the preview…' : props.template.demo || templateRepoUrl(props.template))?.replace(/^https?:\/\//, '').replace(/\/$/, ''))
const openUrl = computed(() => live.value ? livePage.value : props.template.demo)

const startedAt = ref(0)
const now = useNow({ interval: 1000 })
const remaining = computed(() => Math.max(0, PREVIEW_TIMEOUT_MS - (now.value.getTime() - startedAt.value)))
const countdown = computed(() => {
  const seconds = Math.ceil(remaining.value / 1000)
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
})
watch(remaining, value => live.value && value === 0 && stop())

function start() {
  track('Template Action', { template: props.template.name, action: 'Try Live Preview' })
  startedAt.value = Date.now()
  live.value = true
}

function onStatus(value: LivePreviewStatus, ms?: number) {
  status.value = value
  if (ms) readyIn.value = ms
}

function stop() {
  live.value = false
  liveUrl.value = undefined
  status.value = undefined
  readyIn.value = undefined
  device.value = 'desktop'
}
</script>

<template>
  <div class="rounded-xl bg-elevated/40 ring ring-default p-1 shadow-xs">
    <div class="h-9 ps-2.5 pe-1 grid grid-cols-[1fr_minmax(0,auto)_1fr] items-center gap-3">
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
            :text="`${readyIn ? `Ready in ${(readyIn / 1000).toFixed(1)}s. ` : ''}This preview closes on its own after ${PREVIEW_TIMEOUT_MS / 60_000} minutes.`"
            :ui="{ content: 'max-w-xs h-auto py-1.5', text: 'whitespace-normal text-pretty' }"
          >
            <span class="hidden sm:inline font-mono text-muted tabular-nums cursor-default" :class="remaining < 60_000 && 'text-warning'">{{ countdown }} left</span>
          </UTooltip>
        </template>
      </div>

      <div class="min-w-0 flex items-center justify-center gap-1.5 text-xs text-muted">
        <UIcon v-if="!live" name="i-lucide-lock" class="size-3 shrink-0 text-dimmed" />
        <span class="truncate font-mono">{{ address }}</span>
      </div>

      <div class="flex items-center justify-end gap-0.5">
        <template v-if="live">
          <UTooltip v-for="item in ([{ value: 'desktop', icon: 'i-lucide-monitor', label: 'Desktop' }, { value: 'mobile', icon: 'i-lucide-smartphone', label: 'Mobile' }] as const)" :key="item.value" :text="item.label">
            <UButton
              :icon="item.icon"
              :aria-label="item.label"
              :aria-pressed="device === item.value"
              color="neutral"
              :variant="device === item.value ? 'soft' : 'ghost'"
              size="xs"
              class="hidden sm:inline-flex"
              @click="device = item.value"
            />
          </UTooltip>
          <button
            type="button"
            aria-label="Stop live preview"
            class="group ms-1 me-0.5 h-6 ps-2 pe-2.5 flex items-center gap-1.5 rounded-full bg-error/10 ring ring-error/25 text-xs font-medium text-error transition-[background-color,scale] duration-150 ease-snappy hover:bg-error/15 active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-error"
            @click="stop"
          >
            <span class="size-2 rounded-[2px] bg-current transition-transform duration-150 ease-snappy group-hover:scale-110" />
            Stop
          </button>
        </template>
        <UTooltip v-if="openUrl" text="Open in New Tab">
          <UButton
            :to="openUrl"
            target="_blank"
            icon="i-lucide-arrow-up-right"
            aria-label="Open in new tab"
            color="neutral"
            variant="ghost"
            size="xs"
            @click="!live && track('Template Action', { template: template.name, action: 'Open Demo' })"
          />
        </UTooltip>
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
          <TemplatesLivePreview :template="template" @url="liveUrl = $event" @status="onStatus" />
        </div>
      </Transition>

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
            <span class="hidden sm:inline text-xs text-muted">Use it in your browser, nothing to install</span>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>
