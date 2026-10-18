<script setup lang="ts">
interface Company {
  src: string
  alt: string
  url: string
  width: number
  height: number
  scale?: number
}

const props = defineProps<{
  companies: Company[]
}>()

const SET_SIZE = 8
const INTERVAL = 5000
const STAGGER = 0.1

// Equal-area sizing so wide wordmarks and compact marks carry the same visual weight.
const LOGO_AREA = 2600
const LOGO_MAX_WIDTH = 130
const LOGO_MAX_HEIGHT = 30

function logoStyle({ width, height, scale = 1 }: Company) {
  const ratio = width / height
  const w = Math.sqrt(LOGO_AREA * ratio) * scale
  const fit = Math.min(1, LOGO_MAX_WIDTH / w, (LOGO_MAX_HEIGHT * ratio) / w)
  return { width: `${(w * fit).toFixed(1)}px` }
}

const sets = computed(() => {
  const result: Company[][] = []
  for (let i = 0; i < props.companies.length; i += SET_SIZE) {
    result.push(props.companies.slice(i, i + SET_SIZE))
  }
  return result
})

const root = useTemplateRef('root')
const isVisible = useElementVisibility(root)
const isHovered = useElementHover(root)
const documentVisibility = useDocumentVisibility()
const reducedMotion = usePreferredReducedMotion()

const current = ref(0)
const previous = ref<number>()
const revealed = ref(false)

whenever(isVisible, () => {
  revealed.value = true
}, { once: true, immediate: true })

const { pause, resume } = useIntervalFn(() => {
  previous.value = current.value
  current.value = (current.value + 1) % sets.value.length
}, INTERVAL, { immediate: false })

watchEffect(() => {
  const canRotate = revealed.value && isVisible.value && !isHovered.value && documentVisibility.value === 'visible' && reducedMotion.value !== 'reduce' && sets.value.length > 1
  if (canRotate) resume()
  else pause()
})

const rows = computed(() => [
  ...(previous.value !== undefined ? [{ key: `${previous.value}-exit`, state: 'exit', set: sets.value[previous.value]! }] : []),
  { key: `${current.value}-enter`, state: revealed.value ? 'enter' : 'hidden', set: sets.value[current.value]! }
])
</script>

<template>
  <div ref="root" class="grid">
    <ul
      v-for="row in rows"
      :key="row.key"
      :aria-hidden="row.state === 'exit' || undefined"
      :inert="row.state === 'exit' || undefined"
      class="[grid-area:1/1] grid grid-cols-3 items-center gap-x-4 gap-y-8 lg:flex lg:justify-between lg:gap-6"
    >
      <li
        v-for="(company, index) in row.set"
        :key="company.alt"
        :data-state="row.state"
        :style="{ '--delay': `${index * STAGGER}s` }"
        class="logo shrink-0 justify-self-center max-lg:nth-[3n+1]:justify-self-start max-lg:nth-[3n]:justify-self-end max-lg:nth-[n+7]:hidden"
      >
        <NuxtLink :to="company.url" target="_blank" class="group block">
          <BrandLogo
            :src="company.src"
            :alt="company.alt"
            :width="company.width"
            :height="company.height"
            :style="logoStyle(company)"
            class="max-lg:max-w-[26vw] text-muted transition-colors group-hover:text-highlighted"
          />
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.logo {
  --duration: 900ms;
  --curve: cubic-bezier(0.25, 1, 0.5, 1);
}

.logo[data-state="hidden"] {
  opacity: 0;
}

.logo[data-state="enter"] {
  animation: enter var(--duration) var(--curve) var(--delay) both;
}

.logo[data-state="exit"] {
  animation: exit var(--duration) var(--curve) var(--delay) both;
}

@media (prefers-reduced-motion: reduce) {
  .logo[data-state="enter"] {
    animation: none;
  }
}

@keyframes enter {
  from {
    translate: 0 24px;
    filter: blur(4px);
    opacity: 0;
  }
}

@keyframes exit {
  to {
    translate: 0 -24px;
    filter: blur(4px);
    opacity: 0;
  }
}
</style>
