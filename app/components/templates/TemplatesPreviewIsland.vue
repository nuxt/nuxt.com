<script setup lang="ts">
const props = defineProps<{
  active: boolean
}>()

const { editor, editStep, editError, activity, startEditing } = useLivePreview()

const handedOver = ref(false)
let handedOverTimer: ReturnType<typeof setTimeout> | undefined
watch(editor, (value, previous) => {
  clearTimeout(handedOverTimer)
  handedOver.value = value === 'on' && previous === 'starting'
  if (handedOver.value) handedOverTimer = setTimeout(() => handedOver.value = false, 2200)
})
onBeforeUnmount(() => clearTimeout(handedOverTimer))

type IslandState = 'running' | 'queued' | 'done' | 'failed'
interface IslandRow { slot: 'dev' | 'nuxi', key: string, state: IslandState, text: string, step?: number, retry?: boolean, timed?: string }

/** The dev server and Nuxi's change each get a row, so a change waiting on the server says so instead of looking stuck. */
const rows = computed<IslandRow[]>(() => {
  if (!props.active) return []
  const list: IslandRow[] = []
  if (editor.value === 'starting') list.push({ slot: 'dev', key: `dev:${editStep.value}`, state: 'running', text: LIVE_PREVIEW_EDIT_STEPS[Math.min(editStep.value, LIVE_PREVIEW_EDIT_STEPS.length - 1)]!, step: editStep.value, timed: 'dev' })
  else if (editor.value === 'failed') list.push({ slot: 'dev', key: 'dev:failed', state: 'failed', text: editError.value || 'The dev server could not start.', retry: true })
  else if (handedOver.value) list.push({ slot: 'dev', key: 'dev:on', state: 'done', text: 'Live editing on' })
  const change = activity.value
  if (change) {
    const queued = change.state === 'running' && editor.value === 'starting' && change.next
    list.push(queued
      ? { slot: 'nuxi', key: `${change.id}:queued`, state: 'queued', text: `Then ${change.next}` }
      : { slot: 'nuxi', key: `${change.id}:${change.state}`, state: change.state, text: change.label, timed: change.state === 'running' ? change.id : undefined })
  }
  return list
})

const { now, pause, resume } = useNow({ interval: 1000, controls: true, immediate: false })
const timerStarts = ref<Record<string, number>>({})
watch(() => rows.value.map(row => row.timed).filter((key): key is string => !!key), (keys) => {
  const starts: Record<string, number> = {}
  for (const key of keys) starts[key] = timerStarts.value[key] ?? Date.now()
  timerStarts.value = starts
  if (keys.length) resume()
  else pause()
}, { immediate: true })
const elapsed = (key: string) => Math.max(0, Math.floor((now.value.getTime() - (timerStarts.value[key] ?? now.value.getTime())) / 1000))

const content = useTemplateRef('content')
const { width, height } = useElementSize(content, undefined, { box: 'border-box' })
</script>

<template>
  <Transition
    enter-from-class="opacity-0 translate-x-3 translate-y-3"
    enter-active-class="transition-[opacity,translate] duration-300 ease-island"
    leave-active-class="transition-[opacity,translate] duration-250 ease-island"
    leave-to-class="opacity-0 translate-x-3 translate-y-3"
  >
    <div v-if="rows.length" class="island absolute right-0 bottom-0 z-10" role="status" aria-live="polite">
      <svg class="corner absolute right-0 bottom-full" viewBox="0 0 10 10" aria-hidden="true"><path d="M10 0A10 10 0 0 1 0 10H10Z" /></svg>
      <svg class="corner absolute right-full bottom-0" viewBox="0 0 10 10" aria-hidden="true"><path d="M10 0A10 10 0 0 1 0 10H10Z" /></svg>
      <div
        class="overflow-hidden rounded-tl-[14px] bg-(--island) text-white transition-[width,height] duration-500 ease-island"
        :style="{ width: width ? `${width}px` : undefined, height: height ? `${height}px` : undefined }"
      >
        <div ref="content" class="w-max py-0.5 flex flex-col">
          <TransitionGroup
            enter-from-class="opacity-0 blur-[2px] translate-y-1"
            enter-active-class="transition-[opacity,filter,translate] duration-300 ease-island delay-100"
            leave-active-class="transition-[opacity,filter] duration-150 ease-island"
            leave-to-class="opacity-0 blur-[2px]"
          >
            <div v-for="row in rows" :key="row.slot" class="relative h-7">
              <Transition
                enter-from-class="opacity-0 blur-[2px] translate-y-1"
                enter-active-class="transition-[opacity,filter,translate] duration-300 ease-island delay-75"
                leave-active-class="absolute inset-y-0 left-0 transition-[opacity,filter] duration-150 ease-island"
                leave-to-class="opacity-0 blur-[2px]"
              >
                <div :key="row.key" class="h-full ps-3 pe-3.5 flex items-center gap-2 text-xs whitespace-nowrap">
                  <span v-if="row.state === 'running'" class="size-3 shrink-0 rounded-full border-[1.5px] border-white/20 border-t-primary animate-spin" aria-hidden="true" />
                  <UIcon v-else-if="row.state === 'queued'" name="i-lucide-clock-3" class="size-3 shrink-0 text-white/40" />
                  <UIcon v-else :name="row.state === 'done' ? 'i-lucide-check' : 'i-lucide-circle-x'" class="size-3.5 shrink-0" :class="row.state === 'done' ? 'text-primary' : 'text-error'" />
                  <span class="max-w-80 truncate font-medium" :class="row.state === 'queued' ? 'text-white/55' : row.state === 'failed' && 'text-white/80'">{{ row.text }}</span>
                  <span v-if="row.step !== undefined" class="flex items-center gap-0.5" aria-hidden="true">
                    <span
                      v-for="index in LIVE_PREVIEW_EDIT_STEPS.length"
                      :key="index"
                      class="h-1 w-2.5 rounded-full transition-colors duration-300"
                      :class="index <= row.step ? 'bg-primary' : index === row.step + 1 ? 'bg-primary/50 animate-pulse' : 'bg-white/15'"
                    />
                  </span>
                  <span v-if="row.timed && elapsed(row.timed) >= 2" class="font-mono text-[11px] text-white/45 tabular-nums">{{ elapsed(row.timed) }}s</span>
                  <button
                    v-if="row.retry"
                    type="button"
                    class="ms-0.5 font-medium text-white underline decoration-white/30 underline-offset-2 transition-colors hover:decoration-white focus-visible:outline-2 focus-visible:outline-primary rounded-xs"
                    @click="startEditing"
                  >
                    Retry
                  </button>
                </div>
              </Transition>
            </div>
          </TransitionGroup>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.island {
  --island: var(--ui-color-neutral-950);
  filter: drop-shadow(0 -1px 0 rgb(255 255 255 / 0.06));
}

.dark .island {
  filter: drop-shadow(0 -1px 0 rgb(255 255 255 / 0.1));
}

.corner {
  width: 10px;
  height: 10px;
  fill: var(--island);
}

.ease-island {
  transition-timing-function: cubic-bezier(0.32, 0.72, 0, 1);
}

@media (prefers-reduced-motion: reduce) {
  .island * {
    transition-duration: 0s !important;
  }
  .animate-spin {
    animation-duration: 1.5s;
  }
}
</style>
