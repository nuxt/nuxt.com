<script setup lang="ts">
import type { NuxtersCountry, NuxtersMap, NuxterSummary } from '#shared/types'
import { countryFlag, countryName } from '#shared/utils/nuxters-countries'

const props = defineProps<{
  map: NuxtersMap
  /** The best ranked Nuxters of the selected country: the first page of its leaderboard, empty while it loads. */
  people: NuxterSummary[]
}>()
const emit = defineEmits<{ leaderboard: [] }>()
const country = defineModel<string | null>({ default: null })

const { format } = new Intl.NumberFormat('en-US')
const selected = computed(() => props.map.countries.find(item => item.code === country.value))
// The card of the selected country: floating on the globe, or at the bottom of the screen on phones.
const [DefineCard, ReuseCard] = createReusableTemplate<{ country: NuxtersCountry }>()
// One tile per Nuxter shown, known from the count: the card keeps its size while they load.
const tiles = computed(() => Array.from({ length: Math.min(12, selected.value?.count ?? 0) }, (_, index) => {
  const person = props.people[index]
  if (person) return { username: person.username, rank: person.rank }
  const username = selected.value?.top[index]
  return username ? { username, rank: null } : undefined
}))
const personLabel = (person: { username: string, rank: number | null }) => person.rank === null
  ? person.username
  : `${person.username} · #${format(person.rank)}`
const rankOf = (code: string) => props.map.countries.findIndex(item => item.code === code) + 1
const largest = computed(() => props.map.countries[0]?.count ?? 1)

// The globe (and cobe, its WebGL library) loads once the section comes near: the leaderboard does not pay for it.
// Latched: once loaded it stays, and stops drawing by itself off screen. (`once` would keep a first `false` after
// the section starts in view and the page scrolls away.)
const globeBox = useTemplateRef('globeBox')
const { isVisible, stop } = useElementVisibility(globeBox, { rootMargin: '400px', controls: true })
const nearby = ref(false)
watch(isVisible, (visible) => {
  if (!visible) return
  nearby.value = true
  stop()
}, { immediate: true })
</script>

<template>
  <div class="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] gap-8 lg:gap-12 items-center">
    <DefineCard v-slot="{ country: shown }">
      <div class="rounded-lg ring ring-default bg-default/90 backdrop-blur shadow-lg p-4">
        <div class="flex items-center gap-3">
          <UIcon :name="countryFlag(shown.code)" class="size-8 shrink-0" />
          <div class="min-w-0 flex-1">
            <p class="font-semibold text-highlighted truncate">
              {{ countryName(shown.code) }}
            </p>
            <p class="text-sm text-muted">
              {{ format(shown.count) }} {{ shown.count === 1 ? 'Nuxter' : 'Nuxters' }} · #{{ rankOf(shown.code) }} country
            </p>
          </div>
          <UButton
            icon="i-lucide-x"
            color="neutral"
            variant="ghost"
            size="sm"
            aria-label="Show all countries"
            @click="country = null"
          />
        </div>
        <ul class="grid grid-cols-6 gap-2 mt-4" :aria-busy="!people.length || undefined">
          <li v-for="(nuxter, index) in tiles" :key="nuxter?.username ?? `tile-${index}`" class="aspect-square">
            <UTooltip v-if="nuxter" :text="personLabel(nuxter)">
              <NuxtLink :to="`/nuxters/${nuxter.username}`" :aria-label="nuxter.rank === null ? nuxter.username : `${nuxter.username}, #${format(nuxter.rank)}`" class="block size-full rounded-md overflow-hidden bg-muted ring ring-default hover:ring-primary transition">
                <!-- Same URL as the leaderboard: a Nuxter it already shows reuses the image. -->
                <NuxtImg
                  :src="`/gh_avatar/${nuxter.username}`"
                  provider="ipx"
                  densities="x1 x2"
                  width="124"
                  height="124"
                  format="auto"
                  loading="lazy"
                  :alt="nuxter.username"
                  class="size-full"
                />
              </NuxtLink>
            </UTooltip>
            <USkeleton v-else class="size-full rounded-md" />
          </li>
        </ul>
        <UButton
          :label="`See the ${shown.count === 1 ? 'Nuxter' : `${format(shown.count)} Nuxters`} from ${countryName(shown.code)}`"
          trailing-icon="i-lucide-arrow-up"
          color="neutral"
          variant="link"
          class="px-0 mt-3"
          @click="emit('leaderboard')"
        />
      </div>
    </DefineCard>

    <!-- The card floats on the globe: picking a country moves nothing on the page -->
    <div ref="globeBox" class="relative aspect-square w-full max-w-[36rem] mx-auto">
      <LazyNuxtersGlobe
        v-if="nearby"
        :countries="map.countries"
        :selected="country"
        @select="country = $event"
      />
      <div v-else class="size-full rounded-full bg-elevated/50 ring ring-default" />

      <Transition
        enter-active-class="transition duration-150 ease-out motion-reduce:transition-none"
        enter-from-class="opacity-0 translate-y-1"
        leave-active-class="transition duration-100 ease-in motion-reduce:transition-none"
        leave-to-class="opacity-0 translate-y-1"
      >
        <ReuseCard v-if="selected" :country="selected" class="max-sm:hidden absolute right-0 bottom-0 w-80" />
      </Transition>
    </div>

    <div class="flex flex-col gap-4 min-w-0">
      <ol class="max-h-96 overflow-y-auto -mx-2 pr-1" aria-label="Countries, from the most Nuxters">
        <li v-for="item in map.countries" :key="item.code">
          <button
            type="button"
            class="w-full flex items-center gap-3 px-2 py-1.5 rounded-md text-sm text-left hover:bg-elevated/50 transition-colors aria-pressed:bg-elevated"
            :aria-pressed="item.code === country"
            @click="country = item.code === country ? null : item.code"
          >
            <UIcon :name="countryFlag(item.code)" class="size-5 shrink-0" />
            <span class="flex-1 min-w-0">
              <span class="block truncate text-default">{{ countryName(item.code) }}</span>
              <span class="block h-1 mt-1 rounded-full bg-primary/60" :style="{ width: `${Math.max(2, item.count / largest * 100)}%` }" />
            </span>
            <span class="text-muted tabular-nums">{{ format(item.count) }}</span>
          </button>
        </li>
      </ol>

      <p class="text-xs text-dimmed">
        From the location on each GitHub profile, matched to a country: {{ format(map.located) }} of {{ format(map.total) }} Nuxters set one.
      </p>
    </div>

    <!-- Phones: the globe is too small to float on, and often scrolled away from the list. A sheet at the
         bottom of the screen instead, sticky within the section -->
    <Transition
      enter-active-class="transition duration-150 ease-out motion-reduce:transition-none"
      enter-from-class="opacity-0 translate-y-1"
      leave-active-class="transition duration-100 ease-in motion-reduce:transition-none"
      leave-to-class="opacity-0 translate-y-1"
    >
      <ReuseCard v-if="selected" :country="selected" class="sm:hidden sticky bottom-4 z-10" />
    </Transition>
  </div>
</template>
