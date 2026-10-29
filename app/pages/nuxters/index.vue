<script setup lang="ts">
import type { NuxtersMap, NuxtersPage, NuxtersPeriod } from '#shared/types'
import { NUXTERS_DEFAULT_PERIOD, isNuxtersPeriod, nuxterCountryCode, nuxtersPeriodPhrase } from '#shared/utils/nuxters'

definePageMeta({
  heroBackground: 'opacity-70 -z-10'
})

const description = 'Every contribution to the Nuxt ecosystem counts. Discover yours, share your Nuxter profile and unlock your badges on the Nuxt Discord server.'

const ways = [{
  title: 'Merge a pull request',
  description: 'Fix a bug, ship a feature or improve the docs in any Nuxt repository.',
  icon: 'i-lucide-git-merge',
  to: '/docs/community/contribution'
}, {
  title: 'Open a helpful issue',
  description: 'An issue that gets completed, or collects 3+ reactions or 5+ comments.',
  icon: 'i-lucide-circle-dot',
  to: 'https://github.com/nuxt/nuxt/issues',
  target: '_blank'
}, {
  title: 'Write a helpful comment',
  description: 'Answer a question or review a PR: a comment with 3+ reactions counts.',
  icon: 'i-lucide-message-circle-heart',
  to: 'https://github.com/nuxt/nuxt/issues',
  target: '_blank'
}]

const route = useRoute()
const requestedPeriod = computed(() => isNuxtersPeriod(route.query.period) ? route.query.period : undefined)
// `?country=FR`: the leaderboard of one country, picked in the filter or on the globe.
const country = computed({
  get: () => nuxterCountryCode(route.query.country),
  // Same page, no new history entry: the scroll position stays.
  set: value => navigateTo({ query: { ...route.query, country: value ?? undefined }, hash: route.hash }, { replace: true })
})
// The globe, its card and the filter follow a pick right away; the route (and the leaderboard) once its first page loaded.
const picked = ref(country.value)
watch(country, (value) => {
  picked.value = value
})
function pick(value: string | null) {
  picked.value = value
  country.value = value
}

// Nuxt scrolls to the hash on every navigation that keeps one: after a `#leaderboard` arrival,
// another country or period would jump back to the leaderboard. Only the query changed: stay.
if (import.meta.client) {
  const router = useRouter()
  const scrollBehavior = router.options.scrollBehavior
  router.options.scrollBehavior = (to, from, savedPosition) => to.path === from.path && to.hash === from.hash && to.fullPath !== from.fullPath
    ? false
    : scrollBehavior?.(to, from, savedPosition)
  onScopeDispose(() => {
    router.options.scrollBehavior = scrollBehavior
  })
}

// The leaderboard sits above the globe and changes height with the country (a small one has fewer
// rows): a pick from the globe keeps the globe where it is once that leaderboard renders.
let keepWorld = false
let worldTop = 0
const worldSection = () => document.getElementById('world')
function pickInWorld(value: string | null) {
  keepWorld = true
  pick(value)
}

function showLeaderboard() {
  keepWorld = false
  document.getElementById('leaderboard')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
}

// First page server-rendered (ISR, one entry per `?period=` and `?country=`); the leaderboard loads the next ones.
const { data: leaderboard } = await useAsyncData(
  // A `computed()` key, not a getter: `experimental.extractAsyncDataHandlers` takes the first arrow
  // function as the handler, so a getter key is extracted instead (NUXT_E3008 in production).
  computed(() => `nuxters-leaderboard-${requestedPeriod.value ?? 'default'}-${country.value ?? 'all'}`),
  async () => {
    const query = { country: country.value ?? undefined, limit: 100 }
    const page = await $fetch<NuxtersPage>('/api/nuxters', { query: { ...query, period: requestedPeriod.value ?? NUXTERS_DEFAULT_PERIOD } })
    // The default period has no data yet (first import): fall back to all time.
    if (!requestedPeriod.value && !page.periods.includes(page.period) && page.periods.includes('all')) {
      return $fetch<NuxtersPage>('/api/nuxters', { query: { ...query, period: 'all' } })
    }
    return page
  }
)

// Measured right before and right after the leaderboard renders: nothing else can scroll in between.
watch(leaderboard, () => {
  if (keepWorld) worldTop = worldSection()?.getBoundingClientRect().top ?? 0
}, { flush: 'pre' })
watch(leaderboard, () => {
  if (!keepWorld) return
  const top = worldSection()?.getBoundingClientRect().top
  if (top !== undefined && top !== worldTop) scrollBy({ top: top - worldTop, behavior: 'instant' })
  if (leaderboard.value?.country === picked.value) keepWorld = false
}, { flush: 'post' })

const period = computed(() => leaderboard.value?.period ?? NUXTERS_DEFAULT_PERIOD)
// Countries of the same period: the filter and the globe. Not blocking: the leaderboard comes first.
const { data: map } = useFetch<NuxtersMap>('/api/map/nuxters', {
  key: computed(() => `nuxters-map-${period.value}`),
  query: { period },
  lazy: true
})
const countryPeople = useNuxtersCountryPeople({
  leaderboard,
  country: picked,
  // The map follows the resolved period, including the default's all-time fallback.
  period: computed(() => map.value?.period)
})
const available = computed(() => leaderboard.value?.periods ?? [])
// Same page, no hash: the router keeps the scroll position. A `#leaderboard` arrival keeps its hash,
// dropping it would scroll back to the top.
const periodLink = (value: NuxtersPeriod) => ({ query: { ...route.query, period: value }, hash: route.hash })

const { format } = new Intl.NumberFormat('en-US')
// The hero stays the same for every period: the numbers sit right above the leaderboard.
// People first: how the score works (nuxt/nuxt counts double) is in the score modal.
const heroTitle = 'Meet the Nuxters'
const heroDescription = 'The people behind Nuxt and its modules, ranked by their contributions. Thanks to every one of them, Nuxt is a first-class framework and a true community project.'
// A shared `?period=` link shows that leaderboard: title, description, `og:url` and card.
// The canonical URL has no `?period=`, and `/nuxters` alone keeps the generic texts.
const site = useSiteConfig()
const sharedPeriod = computed(() => requestedPeriod.value && leaderboard.value?.total ? period.value : undefined)
const seo = computed(() => {
  if (!sharedPeriod.value) {
    return { title: 'Meet the Nuxters', ogTitle: heroTitle, description }
  }
  const title = `Top Nuxters ${nuxtersPeriodPhrase(sharedPeriod.value)}`
  const page = leaderboard.value!
  const text = `${format(page.total)} contributors made ${format(page.totals.contributions)} contributions to the Nuxt ecosystem ${nuxtersPeriodPhrase(sharedPeriod.value)}. Discover the Nuxters and their profiles.`
  return { title, ogTitle: title, description: text }
})
useSeoMeta({
  title: () => seo.value.title,
  description: () => seo.value.description,
  ogTitle: () => seo.value.ogTitle,
  ogDescription: () => seo.value.description,
  ogUrl: () => `${site.url}/nuxters${sharedPeriod.value ? `?period=${sharedPeriod.value}` : ''}`
})
useCanonical()
defineOgImage('Docs.takumi', {
  headline: () => sharedPeriod.value ? 'Nuxters' : 'Community',
  title: () => seo.value.ogTitle,
  description: () => seo.value.description
})

const breakdown = computed(() => {
  const totals = leaderboard.value?.totals
  if (!totals?.contributions) return []
  const total = leaderboard.value!.total
  return [
    { label: total === 1 ? 'contributor' : 'contributors', value: total, icon: 'i-lucide-users' },
    { label: totals.mergedPullRequests === 1 ? 'merged PR' : 'merged PRs', value: totals.mergedPullRequests, icon: 'i-lucide-git-merge' },
    { label: totals.issues === 1 ? 'issue' : 'issues', value: totals.issues, icon: 'i-lucide-circle-dot' },
    { label: totals.comments === 1 ? 'comment' : 'comments', value: totals.comments, icon: 'i-lucide-message-circle' }
  ]
})
</script>

<template>
  <UPage>
    <!-- Out of scroll anchoring: the card swaps in after hydration, a `#leaderboard` arrival stays on the leaderboard -->
    <UPageHero
      :title="heroTitle"
      :description="heroDescription"
      orientation="horizontal"
      class="[overflow-anchor:none]"
    >
      <template #headline>
        <UBadge label="Updated every day" variant="subtle" />
      </template>
      <!-- The card sizes itself from this width: same height signed out, loading and signed in -->
      <div class="@container">
        <ClientOnly>
          <NuxtersMeCard />
          <template #fallback>
            <NuxtersMeCardSkeleton />
          </template>
        </ClientOnly>
      </div>
    </UPageHero>

    <!-- Right under the hero: the period, search and totals sit on top of the leaderboard -->
    <UPageSection
      id="leaderboard"
      :ui="{ container: 'pt-0 sm:pt-0 lg:pt-0 pb-12 sm:pb-16 lg:pb-16' }"
      class="scroll-mt-24"
    >
      <!-- One child: UPageSection spaces each child of its slot as a separate row -->
      <div>
        <h2 class="sr-only">
          Leaderboard
        </h2>
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <NuxtersPeriodTabs :period="period" :periods="available" :to="periodLink" aria-label="Leaderboard period" />
          <div class="flex flex-col sm:flex-row gap-3">
            <NuxtersCountrySelect :model-value="picked" :countries="map?.countries ?? []" @update:model-value="pick" />
            <NuxtersSearch :period="period" />
          </div>
        </div>

        <ul v-if="breakdown.length" class="flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-4 mb-6 text-sm text-muted" aria-label="Contributions in this period">
          <li v-for="item in breakdown" :key="item.icon" class="flex items-center gap-1.5">
            <UIcon :name="item.icon" class="size-4 text-dimmed" />
            <span><span class="font-semibold text-highlighted tabular-nums">{{ format(item.value) }}</span> {{ item.label }}</span>
          </li>
        </ul>

        <NuxtersLeaderboard v-if="leaderboard?.total" :initial="leaderboard" />
        <p v-else class="text-center text-muted">
          No contributions on record for this period yet.
        </p>
      </div>
    </UPageSection>

    <UPageSection
      v-if="map?.countries.length"
      id="world"
      title="Nuxters around the world"
      :description="`Nuxters from ${format(map.countries.length)} countries ${nuxtersPeriodPhrase(period)}. Pick a country to see its best ranked contributors.`"
      :ui="{ container: 'py-12 sm:py-16 lg:py-16' }"
      class="scroll-mt-24"
    >
      <NuxtersWorld
        :model-value="picked"
        :map="map"
        :people="countryPeople"
        @update:model-value="pickInWorld"
        @leaderboard="showLeaderboard"
      />
    </UPageSection>

    <UPageSection
      title="How to become a Nuxter"
      description="One of these contributions, in any repository of the nuxt, nuxt-modules, nuxt-content, nuxt-hub or nuxt-community organizations, unlocks the Nuxter badge."
      :ui="{ container: 'py-12 sm:py-16 lg:py-16' }"
    >
      <UPageGrid>
        <UPageCard
          v-for="way in ways"
          :key="way.title"
          v-bind="way"
          variant="subtle"
        />
      </UPageGrid>
    </UPageSection>

    <UPageSection :ui="{ container: 'py-12 sm:py-16 lg:py-16' }">
      <UPageCTA
        title="Ready to join us?"
        description="Help shape the future of Nuxt. Contribute, collaborate and join the community today."
        variant="subtle"
        :links="[
          { label: 'Contribution guide', to: '/docs/community/contribution', icon: 'i-lucide-book-open' },
          { label: 'Join Discord', to: 'https://go.nuxt.com/discord', target: '_blank', icon: 'i-simple-icons-discord', color: 'neutral', variant: 'outline' }
        ]"
      />
    </UPageSection>
  </UPage>
</template>
