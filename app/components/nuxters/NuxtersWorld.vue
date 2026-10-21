<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import type { NuxtersMap, NuxterSummary } from '#shared/types'
import { countryFlag, countryName } from '#shared/utils/nuxters-countries'

const props = defineProps<{
  map: NuxtersMap
  /** The best ranked Nuxters of the selected country: the first page of its leaderboard. */
  people: NuxterSummary[]
  /** Where "See them all" goes: the leaderboard, filtered on the country. */
  leaderboard: RouteLocationRaw
}>()
const country = defineModel<string | null>({ default: null })

const { format } = new Intl.NumberFormat('en-US')
const selected = computed(() => props.map.countries.find(item => item.code === country.value))
const rankOf = (code: string) => props.map.countries.findIndex(item => item.code === code) + 1
const largest = computed(() => props.map.countries[0]?.count ?? 1)

// The globe (and cobe, its WebGL library) loads once the section comes near: the leaderboard does not pay for it.
const globeBox = useTemplateRef('globeBox')
const nearby = useElementVisibility(globeBox, { rootMargin: '400px', once: true })
</script>

<template>
  <div class="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] gap-8 lg:gap-12 items-center">
    <div ref="globeBox" class="aspect-square w-full max-w-[36rem] mx-auto">
      <LazyNuxtersGlobe
        v-if="nearby"
        :countries="map.countries"
        :selected="country"
        @select="country = $event"
      />
      <div v-else class="size-full rounded-full bg-elevated/50 ring ring-default" />
    </div>

    <div class="flex flex-col gap-4 min-w-0">
      <div v-if="selected" class="rounded-lg ring ring-default bg-elevated/50 p-4">
        <div class="flex items-center gap-3">
          <UIcon :name="countryFlag(selected.code)" class="size-8 shrink-0" />
          <div class="min-w-0 flex-1">
            <p class="font-semibold text-highlighted truncate">
              {{ countryName(selected.code) }}
            </p>
            <p class="text-sm text-muted">
              {{ format(selected.count) }} {{ selected.count === 1 ? 'Nuxter' : 'Nuxters' }} · #{{ rankOf(selected.code) }} country
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
        <ul v-if="people.length" class="grid grid-cols-6 gap-2 mt-4">
          <li v-for="nuxter in people.slice(0, 12)" :key="nuxter.githubId">
            <UTooltip :text="`${nuxter.username} · #${format(nuxter.rank)}`">
              <NuxtLink :to="`/nuxters/${nuxter.username}`" :aria-label="`${nuxter.username}, #${format(nuxter.rank)}`" class="block aspect-square rounded-md overflow-hidden bg-muted ring ring-default hover:ring-primary transition">
                <NuxtImg
                  :src="`/gh_avatar/${nuxter.username}`"
                  provider="ipx"
                  densities="x1 x2"
                  width="56"
                  height="56"
                  format="auto"
                  loading="lazy"
                  :alt="nuxter.username"
                  class="size-full"
                />
              </NuxtLink>
            </UTooltip>
          </li>
        </ul>
        <UButton
          :to="leaderboard"
          :label="`See the ${selected.count === 1 ? 'Nuxter' : `${format(selected.count)} Nuxters`} from ${countryName(selected.code)}`"
          trailing-icon="i-lucide-arrow-up"
          color="neutral"
          variant="link"
          class="px-0 mt-3"
        />
      </div>

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
  </div>
</template>
