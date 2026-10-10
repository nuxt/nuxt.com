<script setup lang="ts">
import type { Nuxter, NuxterPeriodStats, NuxterProfile, NuxtersPeriod } from '#shared/types'
import { isNuxtersPeriod, nuxterForPeriod, nuxterHackathons, nuxtersPeriodLabel } from '#shared/utils/nuxters'

definePageMeta({
  heroBackground: 'opacity-30 -z-10'
})

const route = useRoute()
const router = useRouter()
const param = String(route.params.username)

// The profile has every period: switching period needs no request.
const { data: nuxter } = await useFetch<NuxterProfile>(`/api/nuxters/${param}`, {
  key: `nuxter-${param.toLowerCase()}`
})

if (!nuxter.value) {
  throw createError({ statusCode: 404, statusMessage: 'Nuxter not found', fatal: true })
}

// One URL per profile: /nuxters/Atinux → /nuxters/atinux
if (param !== nuxter.value.username) {
  await navigateTo({ path: `/nuxters/${nuxter.value.username}`, query: route.query }, { redirectCode: 301, replace: true })
}

const { format } = new Intl.NumberFormat('en-US')
const username = nuxter.value.username
const hackathons = computed(() => nuxterHackathons(nuxter.value?.githubId))

const since = computed(() => {
  const date = nuxter.value?.firstContributionAt
  return date ? new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(date)) : null
})

// `?period=`: all time by default, or any period the user contributed in.
const available = computed<NuxtersPeriod[]>(() => ['all', ...(nuxter.value?.periods ?? []).map(row => row.period)])
const period = computed<NuxtersPeriod>(() => {
  const requested = route.query.period
  return isNuxtersPeriod(requested) && available.value.includes(requested) ? requested : 'all'
})
const current = computed<Nuxter>(() => nuxterForPeriod(nuxter.value!, period.value) ?? nuxter.value!)
const rankOf = (value: NuxtersPeriod) => nuxterForPeriod(nuxter.value!, value)?.rank

/** Profile links keep the default period out of the URL. */
const periodQuery = (value: NuxtersPeriod) => ({ ...route.query, period: value === 'all' ? undefined : value })

const tabs = computed(() => ['30d', '12m', 'all']
  .filter(value => available.value.includes(value))
  .map(value => ({ value, label: nuxtersPeriodLabel(value), rank: rankOf(value), to: { query: periodQuery(value) } })))
const years = computed(() => available.value.filter(value => /^\d{4}$/.test(value)))

function selectYear(value: string | number | undefined) {
  if (!value || !isNuxtersPeriod(String(value))) return
  router.replace({ query: periodQuery(String(value)) })
}

const periodPhrase = (value: NuxtersPeriod) => {
  if (value === '30d') return 'in the last 30 days'
  if (value === '12m') return 'in the last 12 months'
  if (value === 'all') return 'of all time'
  return `in ${value}`
}

const yearly = computed(() => (nuxter.value?.periods ?? []).filter(row => /^\d{4}$/.test(row.period)))
// Best rank; on a tie (#1 several years), the year with the most points.
const best = computed(() => yearly.value.reduce<typeof yearly.value[number] | undefined>((top, row) =>
  !top || row.rank < top.rank || (row.rank === top.rank && row.score > top.score) ? row : top, undefined))

// One look per contribution type, for the stat cards and the year rows.
// Same colors as the README card (OgImage/Nuxter.takumi.vue). Darker text in light mode, for contrast.
const METRICS = {
  mergedPullRequests: { one: 'merged PR', many: 'merged PRs', icon: 'i-lucide-git-merge', ring: 'ring-primary', text: 'text-primary' },
  issues: { one: 'issue', many: 'issues', icon: 'i-lucide-circle-dot', ring: 'ring-sky-400', text: 'text-sky-600 dark:text-sky-400' },
  comments: { one: 'comment', many: 'comments', icon: 'i-lucide-message-circle', ring: 'ring-violet-400', text: 'text-violet-600 dark:text-violet-400' },
  reactions: { one: 'reaction', many: 'reactions', icon: 'i-lucide-smile-plus', ring: 'ring-yellow-400', text: 'text-amber-600 dark:text-yellow-400' }
} as const
type Metric = keyof typeof METRICS

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)
const metricLabel = (metric: Metric, value: number) => value === 1 ? METRICS[metric].one : METRICS[metric].many
const metricValue = (stats: Nuxter | NuxterPeriodStats, metric: Metric) => metric === 'mergedPullRequests' ? stats.mergedPullRequests.all : stats[metric]

const stats = computed(() => {
  const n = current.value
  const details: Record<Metric, string> = {
    mergedPullRequests: `${format(n.mergedPullRequests.feat)} feat · ${format(n.mergedPullRequests.fix)} fix · ${format(n.mergedPullRequests.docs)} docs · ${format(n.mergedPullRequests.chore)} chore`,
    issues: `${format(n.helpfulIssues)} helpful`,
    comments: `${format(n.helpfulComments)} helpful`,
    reactions: 'received'
  }
  return (Object.keys(METRICS) as Metric[]).map(metric => ({
    ...METRICS[metric],
    label: capitalize(metricLabel(metric, metricValue(n, metric))),
    value: metricValue(n, metric),
    detail: details[metric]
  }))
})

// Meta stays on all-time stats: the canonical URL has no `?period=`.
const title = `${username} is a Nuxter`
const description = `Discover ${username}'s contributions to the Nuxt ecosystem: #${format(nuxter.value.rank)} with ${format(nuxter.value.score)} points.`
useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description
})
useCanonical()
defineOgImage('Nuxter.takumi', { username }, {
  // Stats change once a day
  cacheMaxAgeSeconds: 60 * 60
})
</script>

<template>
  <UPage v-if="nuxter">
    <UContainer class="pt-8">
      <!-- Back to the leaderboard of the period on screen -->
      <UButton
        :to="{ path: '/nuxters', query: { period }, hash: '#leaderboard' }"
        label="All Nuxters"
        icon="i-lucide-arrow-left"
        color="neutral"
        variant="link"
        class="px-0"
      />
    </UContainer>

    <!-- Profile on the left, stats on the right; stacked below lg -->
    <UContainer id="profile" class="py-8 lg:py-20 scroll-mt-16">
      <!-- Stats get more room: 2/5 + 3/5 on lg, 1/3 + 2/3 from xl -->
      <div class="grid lg:grid-cols-5 xl:grid-cols-3 gap-8 lg:gap-12 items-center">
        <!-- Below lg: avatar next to the name, everything left-aligned and compact -->
        <div class="flex flex-col items-start gap-4 lg:gap-6 lg:col-span-2 xl:col-span-1 min-w-0">
          <div class="flex flex-row lg:flex-col items-center lg:items-start gap-4 lg:gap-6">
            <!-- Square, like the leaderboard avatars -->
            <NuxtImg
              :src="`/gh_avatar/${nuxter.username}`"
              provider="ipx"
              densities="x1 x2"
              width="112"
              height="112"
              format="auto"
              :alt="nuxter.username"
              class="size-20 lg:size-28 shrink-0 rounded-xl ring ring-default bg-muted"
            />

            <div class="flex flex-col gap-1 lg:gap-2 min-w-0">
              <!-- Usernames go up to 39 characters: smaller title for long ones, full name on hover -->
              <h1
                class="text-3xl sm:text-4xl font-bold text-highlighted truncate"
                :class="{ 'lg:text-5xl': nuxter.username.length <= 14 }"
                :title="nuxter.username"
              >
                {{ nuxter.username }}
              </h1>
              <ULink
                :to="`https://github.com/${nuxter.username}`"
                target="_blank"
                class="inline-flex items-center gap-1.5 text-sm lg:text-base text-muted"
              >
                <UIcon name="i-simple-icons-github" class="size-4 shrink-0" />
                <span class="truncate">github.com/{{ nuxter.username }}</span>
              </ULink>
            </div>
          </div>

          <div class="flex flex-col gap-1 lg:gap-3">
            <div class="flex flex-wrap items-center gap-x-3 gap-y-1 lg:text-lg">
              <span class="tabular-nums">
                <template v-if="period === 'all'">Nuxter #{{ format(current.rank) }}</template>
                <template v-else>#{{ format(current.rank) }} {{ periodPhrase(period) }}</template>
              </span>
              <span class="text-dimmed">·</span>
              <span class="flex items-center gap-1">
                <span class="font-semibold text-highlighted tabular-nums">{{ format(current.score) }}</span> pts
                <NuxtersScoreBreakdown :nuxter="current" />
              </span>
            </div>
            <p v-if="since" class="text-sm lg:text-base text-muted">
              Contributing since {{ since }}
            </p>
          </div>

          <div v-if="hackathons.length" class="flex flex-wrap gap-2">
            <UBadge
              v-for="hackathon in hackathons"
              :key="hackathon.id"
              :label="hackathon.name"
              icon="i-lucide-trophy"
              variant="subtle"
              class="lg:text-sm"
            />
          </div>

          <!-- Sharing is a desktop action (copying Markdown into a GitHub README) -->
          <div class="hidden lg:block">
            <NuxtersShare :username="nuxter.username" />
          </div>
        </div>

        <div class="flex flex-col gap-4 lg:col-span-3 xl:col-span-2">
          <div class="flex flex-wrap items-center lg:justify-end gap-3">
            <UFieldGroup v-if="tabs.length > 1" aria-label="Profile period">
              <UButton
                v-for="tab in tabs"
                :key="tab.value"
                :to="tab.to"
                replace
                color="neutral"
                :variant="tab.value === period ? 'solid' : 'outline'"
                :aria-current="tab.value === period ? 'page' : undefined"
                class="whitespace-nowrap"
              >
                {{ tab.label }}
                <!-- The rank does not fit on small screens: the rank line above shows it -->
                <span v-if="tab.rank" class="hidden sm:inline tabular-nums opacity-70">#{{ format(tab.rank) }}</span>
              </UButton>
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
              :ui="{ base: 'text-sm/5' }"
              aria-label="Profile by year"
              @update:model-value="selectYear"
            />
          </div>

          <ul class="grid grid-cols-2 gap-4" :aria-label="`Contributions ${periodPhrase(period)}`">
            <li v-for="stat in stats" :key="stat.icon">
              <UPageCard
                :icon="stat.icon"
                variant="subtle"
                :class="['h-full', stat.ring]"
                :ui="{ leadingIcon: stat.text }"
              >
                <div class="flex flex-col gap-1">
                  <span class="text-3xl sm:text-4xl font-semibold text-highlighted tabular-nums">{{ format(stat.value) }}</span>
                  <span :class="stat.text">{{ stat.label }}</span>
                  <span class="text-sm text-muted">{{ stat.detail }}</span>
                </div>
              </UPageCard>
            </li>
          </ul>
        </div>
      </div>
    </UContainer>

    <UPageBody class="mt-0">
      <UContainer>
        <div v-if="yearly.length">
          <h2 class="text-2xl font-bold text-highlighted mb-1">
            Year by year
          </h2>
          <p v-if="best" class="text-muted mb-6">
            Best year: {{ best.period }}, #{{ format(best.rank) }} with {{ format(best.score) }} points.
          </p>
          <UPageCard variant="subtle" :ui="{ container: 'p-0 sm:p-0' }">
            <ul class="divide-y divide-default">
              <li v-for="row in yearly" :key="row.period">
                <!-- Selects the year on this profile, and scrolls back up to the stats -->
                <NuxtLink
                  :to="{ query: periodQuery(row.period), hash: '#profile' }"
                  replace
                  :aria-current="row.period === period ? 'page' : undefined"
                  class="grid grid-cols-[4rem_1fr_auto] sm:grid-cols-[5rem_8rem_1fr_auto] items-center gap-4 px-4 sm:px-6 py-3 hover:bg-elevated/50 transition-colors"
                  :class="{ 'bg-elevated/70': row.period === period }"
                >
                  <span class="font-semibold text-highlighted tabular-nums">{{ row.period }}</span>
                  <span class="tabular-nums">#{{ format(row.rank) }}</span>
                  <span class="hidden sm:flex items-center gap-4 text-sm text-muted tabular-nums">
                    <span
                      v-for="(style, metric) in METRICS"
                      :key="metric"
                      class="inline-flex items-center gap-1.5 w-20"
                      :title="`${format(metricValue(row, metric))} ${metricLabel(metric, metricValue(row, metric))}`"
                    >
                      <UIcon :name="style.icon" class="size-4 shrink-0" :class="style.text" aria-hidden="true" />
                      {{ format(metricValue(row, metric)) }}
                      <span class="sr-only">{{ metricLabel(metric, metricValue(row, metric)) }}</span>
                    </span>
                  </span>
                  <span class="text-right tabular-nums"><span class="font-medium text-highlighted">{{ format(row.score) }}</span> pts</span>
                </NuxtLink>
              </li>
            </ul>
          </UPageCard>
        </div>
      </UContainer>
    </UPageBody>
  </UPage>
</template>
