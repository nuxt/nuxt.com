<script setup lang="ts">
/**
 * A small Nuxt project where the directory decides routes and imports.
 * The highlight steps through `pages/`, `components/`, `composables/` and `server/api/`.
 */
const motion = useAgentsMotion()

const rows = [
  { name: 'app/', depth: 0, dir: true },
  { name: 'pages/', depth: 1, dir: true, note: 'routes' },
  { name: 'index.vue', depth: 2, note: '/' },
  { name: 'posts/[slug].vue', depth: 2, note: '/posts/:slug' },
  { name: 'components/', depth: 1, dir: true, note: 'auto-imported' },
  { name: 'PostCard.vue', depth: 2 },
  { name: 'composables/', depth: 1, dir: true, note: 'auto-imported' },
  { name: 'usePosts.ts', depth: 2 },
  { name: 'server/', depth: 0, dir: true },
  { name: 'api/', depth: 1, dir: true, note: 'API routes' },
  { name: 'posts.get.ts', depth: 2, note: '/api/posts' },
  { name: 'nuxt.config.ts', depth: 0 }
]

const ROW = 30
// Rows 1, 4, 6 and 9: pages/, components/, composables/ and server/api/.
const steps = [1, 4, 6, 9]
const step = ref(0)

const { pause, resume } = useIntervalFn(() => {
  step.value = (step.value + 1) % steps.length
}, 1500, { immediate: false })

watch(motion, on => on ? resume() : pause())

const highlightY = computed(() => (motion.value ? steps[step.value]! : steps[0]!) * ROW)
</script>

<template>
  <figure aria-label="A Nuxt project: the directory decides routes and imports" class="not-prose m-0 rounded-[14px] border border-default bg-elevated overflow-hidden">
    <div class="flex items-center gap-2 h-11 px-4 border-b border-default font-mono text-[13px] font-medium text-muted">
      <UIcon name="i-lucide-folder" class="size-3.5" />
      my-nuxt-app
    </div>
    <div class="relative py-2">
      <div
        aria-hidden="true"
        class="absolute inset-x-0 top-2 h-7.5 border-l-2 border-primary bg-primary/8 transition-transform duration-300 motion-reduce:transition-none"
        :style="{ transform: `translateY(${highlightY}px)` }"
      />
      <div
        v-for="row in rows"
        :key="row.name"
        class="relative flex items-center justify-between gap-3 h-7.5 px-4 font-mono text-[13px]/none"
      >
        <span
          class="flex items-center gap-2 min-w-0 whitespace-nowrap"
          :class="row.dir ? 'text-highlighted' : 'text-toned'"
          :style="{ paddingLeft: `${row.depth * 18}px` }"
        >
          <UIcon :name="row.dir ? 'i-lucide-folder' : 'i-lucide-file'" class="size-3.5 shrink-0" :class="row.dir ? 'opacity-70' : 'opacity-60'" />
          {{ row.name }}
        </span>
        <span v-if="row.note" class="shrink-0 text-xs text-muted whitespace-nowrap">{{ row.note }}</span>
      </div>
    </div>
  </figure>
</template>
