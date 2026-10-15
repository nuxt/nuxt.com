<script setup lang="ts">
import type { NuxtersPage, NuxtersPeriod } from '#shared/types'
import { NUXTERS_DEFAULT_PERIOD, isNuxtersPeriod, nuxtersPeriodPhrase } from '#shared/utils/nuxters'

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

// First page server-rendered (ISR, one entry per `?period=`); the leaderboard loads the next ones.
const { data: leaderboard } = await useAsyncData(
  // A `computed()` key, not a getter: `experimental.extractAsyncDataHandlers` takes the first arrow
  // function as the handler, so a getter key is extracted instead (NUXT_E3008 in production).
  computed(() => `nuxters-leaderboard-${requestedPeriod.value ?? 'default'}`),
  async () => {
    const page = await $fetch<NuxtersPage>('/api/nuxters', { query: { period: requestedPeriod.value ?? NUXTERS_DEFAULT_PERIOD, limit: 100 } })
    // The default period has no data yet (first import): fall back to all time.
    if (!requestedPeriod.value && !page.periods.includes(page.period) && page.periods.includes('all')) {
      return $fetch<NuxtersPage>('/api/nuxters', { query: { period: 'all', limit: 100 } })
    }
    return page
  }
)

const period = computed(() => leaderboard.value?.period ?? NUXTERS_DEFAULT_PERIOD)
const available = computed(() => leaderboard.value?.periods ?? [])
// Same page, no hash: the router keeps the scroll position. A `#leaderboard` arrival keeps its hash,
// dropping it would scroll back to the top.
const periodLink = (value: NuxtersPeriod) => ({ query: { ...route.query, period: value }, hash: route.hash })

const { format } = new Intl.NumberFormat('en-US')
// The hero stays the same for every period: the numbers sit right above the leaderboard.
const heroTitle = 'Discover Nuxt contributors'
// nuxt/framework and nuxt/docs are archived former homes of nuxt/nuxt: the score modal lists them.
const heroDescription = 'Every contribution to the Nuxt ecosystem counts. Ranked by score, where nuxt/nuxt counts double. Updated every day.'
// A shared `?period=` link shows that leaderboard: title, description, `og:url` and card.
// The canonical URL has no `?period=`, and `/nuxters` alone keeps the generic texts.
const site = useSiteConfig()
const sharedPeriod = computed(() => requestedPeriod.value && leaderboard.value?.total ? period.value : undefined)
const seo = computed(() => {
  if (!sharedPeriod.value) {
    return { title: 'Nuxters', ogTitle: heroTitle, description }
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
      <ClientOnly>
        <NuxtersMeCard />
        <template #fallback>
          <USkeleton class="h-64 w-full rounded-lg" />
        </template>
      </ClientOnly>
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
          <NuxtersSearch :period="period" />
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
