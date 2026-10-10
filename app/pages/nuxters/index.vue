<script setup lang="ts">
import type { NuxtersPage, NuxtersPeriod } from '#shared/types'
import { NUXTERS_DEFAULT_PERIOD, isNuxtersPeriod, nuxtersPeriodLabel } from '#shared/utils/nuxters'

definePageMeta({
  heroBackground: 'opacity-70 -z-10'
})

const title = 'Nuxters'
const description = 'Every contribution to the Nuxt ecosystem counts. Discover yours, share your Nuxter profile and unlock your badges on the Nuxt Discord server.'

useSeoMeta({
  title,
  description,
  ogTitle: 'Are you a Nuxter?',
  ogDescription: description
})
useCanonical()
defineOgImage('Docs.takumi', {
  headline: 'Community',
  title: 'Are you a Nuxter?',
  description
})

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
  to: 'https://github.com/nuxt/nuxt/discussions',
  target: '_blank'
}]

const route = useRoute()
const router = useRouter()
const requestedPeriod = computed(() => isNuxtersPeriod(route.query.period) ? route.query.period : undefined)

// First page server-rendered (ISR, one entry per `?period=`); the leaderboard loads the next ones.
const { data: leaderboard } = await useAsyncData(
  () => `nuxters-leaderboard-${requestedPeriod.value ?? 'default'}`,
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
// Links, not tabs: each leaderboard has its own URL, which works without JavaScript.
const tabs = computed(() => ['30d', '12m', 'all']
  .filter(value => available.value.includes(value))
  .map(value => ({ label: nuxtersPeriodLabel(value), value, to: { query: { ...route.query, period: value }, hash: '#leaderboard' } })))
const years = computed(() => available.value.filter(value => /^\d{4}$/.test(value)))

function selectYear(value: string | number | undefined) {
  if (!value || !isNuxtersPeriod(String(value))) return
  router.replace({ query: { ...route.query, period: String(value) }, hash: '#leaderboard' })
}

const { format } = new Intl.NumberFormat('en-US')
const summary = computed(() => {
  const page = leaderboard.value
  if (!page?.total) return 'Ranked by score. Updated every day.'
  const people = `${format(page.total)} ${page.total === 1 ? 'contributor' : 'contributors'}`
  const made = `${format(page.totals.contributions)} ${page.totals.contributions === 1 ? 'contribution' : 'contributions'}`
  // nuxt/framework and nuxt/docs are archived former homes of nuxt/nuxt: the score modal lists them.
  return `${people} made ${made} ${periodPhrase(period.value)}. Ranked by score, where nuxt/nuxt counts double. Updated every day.`
})
const breakdown = computed(() => {
  const totals = leaderboard.value?.totals
  if (!totals?.contributions) return []
  return [
    { label: totals.mergedPullRequests === 1 ? 'merged PR' : 'merged PRs', value: totals.mergedPullRequests, icon: 'i-lucide-git-merge' },
    { label: totals.issues === 1 ? 'issue' : 'issues', value: totals.issues, icon: 'i-lucide-circle-dot' },
    { label: totals.comments === 1 ? 'comment' : 'comments', value: totals.comments, icon: 'i-lucide-message-circle' }
  ]
})

const periodPhrase = (value: NuxtersPeriod) => {
  if (value === '30d') return 'in the last 30 days'
  if (value === '12m') return 'in the last 12 months'
  if (value === 'all') return 'of all time'
  return `in ${value}`
}
</script>

<template>
  <UPage>
    <UPageHero
      title="Are you a Nuxter?"
      :description="description"
      orientation="horizontal"
    >
      <ClientOnly>
        <NuxtersMeCard />
        <template #fallback>
          <USkeleton class="h-64 w-full rounded-lg" />
        </template>
      </ClientOnly>
    </UPageHero>

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
          spotlight
        />
      </UPageGrid>
    </UPageSection>

    <UPageSection
      id="leaderboard"
      title="They are already Nuxters"
      :description="summary"
      :ui="{ container: 'py-12 sm:py-16 lg:py-16' }"
    >
      <!-- One child: UPageSection spaces each child of its slot as a separate row -->
      <div>
        <div class="flex flex-wrap items-center justify-center gap-3 mb-6">
          <UFieldGroup v-if="tabs.length > 1" aria-label="Leaderboard period">
            <UButton
              v-for="tab in tabs"
              :key="tab.value"
              :label="tab.label"
              :to="tab.to"
              replace
              color="neutral"
              :variant="tab.value === period ? 'solid' : 'outline'"
              :aria-current="tab.value === period ? 'page' : undefined"
            />
          </UFieldGroup>
          <USelect
            v-if="years.length"
            :model-value="years.includes(period) ? period : undefined"
            :items="years"
            placeholder="By year"
            icon="i-lucide-calendar"
            :color="years.includes(period) ? 'primary' : 'neutral'"
            :highlight="years.includes(period)"
            class="w-36"
            aria-label="Leaderboard by year"
            @update:model-value="selectYear"
          />
        </div>

        <ul v-if="breakdown.length" class="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-10 text-muted" aria-label="Contributions in this period">
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
