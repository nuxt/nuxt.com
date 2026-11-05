<script setup lang="ts">
const stats = useStats()

const root = useTemplateRef('root')
const visible = useElementVisibility(root)
const reducedMotion = usePreferredReducedMotion()

// Server-rendered with the real values so crawlers get them; the numbers stay hidden until they count up.
const revealed = ref(false)
const progress = ref(1)

onMounted(() => {
  if (reducedMotion.value === 'reduce') {
    revealed.value = true
    return
  }
  progress.value = 0
  whenever(visible, () => {
    revealed.value = true
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 1600)
      progress.value = 1 - (1 - t) ** 4
      if (t < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, { once: true, immediate: true })
})

// Count from half the value rather than zero.
const countUp = (value: number) => value * (0.5 + 0.5 * progress.value)

const items = computed(() => {
  const { monthlyDownloads, monthlyDownloadsLastYear, stars, modules } = stats.value ?? {}
  const growth = monthlyDownloads && monthlyDownloadsLastYear ? monthlyDownloads / monthlyDownloadsLastYear : 0
  return [
    monthlyDownloads && { key: 'downloads', value: formatNumber(Math.round(countUp(monthlyDownloads))), label: 'Monthly downloads' },
    growth && { key: 'growth', value: `${(1 + (growth - 1) * progress.value).toFixed(1)}×`, label: 'Growth in a year' },
    stars && { key: 'stars', value: formatNumber(Math.round(countUp(stars))), label: 'GitHub stars' },
    modules && { key: 'modules', value: String(Math.round(countUp(modules))), label: 'Modules' }
  ].filter(item => !!item)
})
</script>

<template>
  <dl
    v-if="items.length"
    ref="root"
    class="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-8 border-y border-default py-8"
  >
    <div v-for="item in items" :key="item.key" class="flex flex-col-reverse justify-end gap-1">
      <dt class="text-sm text-muted">
        {{ item.label }}
      </dt>
      <dd
        class="text-3xl sm:text-4xl font-semibold tabular-nums transition-opacity duration-500 ease-out motion-reduce:transition-none"
        :class="[item.key === 'growth' ? 'text-primary' : 'text-highlighted', revealed ? 'opacity-100' : 'opacity-0']"
      >
        {{ item.value }}
      </dd>
    </div>
  </dl>
</template>
