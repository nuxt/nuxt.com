<script setup lang="ts">
import type { NuxterProfile } from '#shared/types'
import { nuxterHackathons, nuxtersPeriodLabel } from '#shared/utils/nuxters'

definePageMeta({
  heroBackground: 'opacity-70 -z-10'
})

const route = useRoute()
const param = String(route.params.username)

const { data: nuxter } = await useFetch<NuxterProfile>(`/api/nuxters/${param}`, {
  key: `nuxter-${param.toLowerCase()}`
})

if (!nuxter.value) {
  throw createError({ statusCode: 404, statusMessage: 'Nuxter not found', fatal: true })
}

// One URL per profile: /nuxters/Atinux → /nuxters/atinux
if (param !== nuxter.value.username) {
  await navigateTo(`/nuxters/${nuxter.value.username}`, { redirectCode: 301, replace: true })
}

const { format } = new Intl.NumberFormat('en-US')
const username = nuxter.value.username
const hackathons = computed(() => nuxterHackathons(nuxter.value?.githubId))

const since = computed(() => {
  const date = nuxter.value?.firstContributionAt
  return date ? new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(date)) : null
})
const recent = computed(() => (nuxter.value?.periods ?? []).filter(row => row.period === '30d' || row.period === '12m'))
const yearly = computed(() => (nuxter.value?.periods ?? []).filter(row => /^\d{4}$/.test(row.period)))
const best = computed(() => yearly.value.reduce<typeof yearly.value[number] | undefined>((top, row) => !top || row.rank < top.rank ? row : top, undefined))

const stats = computed(() => {
  const n = nuxter.value!
  return [
    { label: n.mergedPullRequests.all === 1 ? 'Merged PR' : 'Merged PRs', value: n.mergedPullRequests.all, icon: 'i-lucide-git-merge', detail: `${format(n.mergedPullRequests.feat)} feat · ${format(n.mergedPullRequests.fix)} fix · ${format(n.mergedPullRequests.docs)} docs · ${format(n.mergedPullRequests.chore)} chore` },
    { label: n.issues === 1 ? 'Issue' : 'Issues', value: n.issues, icon: 'i-lucide-circle-dot', detail: `${format(n.helpfulIssues)} helpful` },
    { label: n.comments === 1 ? 'Comment' : 'Comments', value: n.comments, icon: 'i-lucide-message-circle', detail: `${format(n.helpfulComments)} helpful` },
    { label: n.reactions === 1 ? 'Reaction' : 'Reactions', value: n.reactions, icon: 'i-lucide-smile-plus', detail: 'received' }
  ]
})

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
      <UButton
        to="/nuxters"
        label="All Nuxters"
        icon="i-lucide-arrow-left"
        color="neutral"
        variant="link"
        class="px-0"
      />
    </UContainer>

    <!-- Profile on the left, stats on the right; stacked below lg -->
    <UContainer class="py-12 lg:py-20">
      <div class="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <div class="flex flex-col items-center text-center lg:items-start lg:text-left gap-6">
          <NuxtImg
            :src="`/gh_avatar/${nuxter.username}`"
            provider="ipx"
            densities="x1 x2"
            width="112"
            height="112"
            format="auto"
            :alt="nuxter.username"
            class="size-28 rounded-full ring-4 ring-default bg-muted"
          />

          <div class="flex flex-col gap-2">
            <h1 class="text-4xl sm:text-5xl font-bold text-highlighted">
              {{ nuxter.username }}
            </h1>
            <ULink
              :to="`https://github.com/${nuxter.username}`"
              target="_blank"
              class="inline-flex items-center justify-center lg:justify-start gap-1.5 text-muted"
            >
              <UIcon name="i-simple-icons-github" class="size-4" />
              github.com/{{ nuxter.username }}
            </ULink>
          </div>

          <div class="flex flex-col items-center lg:items-start gap-3">
            <div class="flex items-center gap-3 text-lg">
              <span class="tabular-nums">Nuxter #{{ format(nuxter.rank) }}</span>
              <span class="text-dimmed">·</span>
              <span class="flex items-center gap-1">
                <span class="font-semibold text-highlighted tabular-nums">{{ format(nuxter.score) }}</span> pts
                <NuxtersScoreBreakdown :nuxter="nuxter" />
              </span>
            </div>
            <p v-if="since" class="text-muted">
              Contributing since {{ since }}
            </p>
          </div>

          <div v-if="recent.length || hackathons.length" class="flex flex-wrap justify-center lg:justify-start gap-2">
            <UBadge
              v-for="row in recent"
              :key="row.period"
              :label="`${nuxtersPeriodLabel(row.period)}: #${format(row.rank)}`"
              color="neutral"
              variant="outline"
              size="lg"
            />
            <UBadge
              v-for="hackathon in hackathons"
              :key="hackathon.id"
              :label="hackathon.name"
              icon="i-lucide-trophy"
              variant="subtle"
              size="lg"
            />
          </div>

          <NuxtersShare :username="nuxter.username" />
        </div>

        <ul class="grid grid-cols-2 gap-4" aria-label="All-time contributions">
          <li v-for="stat in stats" :key="stat.label">
            <UPageCard :icon="stat.icon" variant="subtle" class="h-full">
              <div class="flex flex-col gap-1">
                <span class="text-3xl sm:text-4xl font-semibold text-highlighted tabular-nums">{{ format(stat.value) }}</span>
                <span class="text-default">{{ stat.label }}</span>
                <span class="text-sm text-muted">{{ stat.detail }}</span>
              </div>
            </UPageCard>
          </li>
        </ul>
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
                <NuxtLink
                  :to="`/nuxters?period=${row.period}#leaderboard`"
                  class="grid grid-cols-[4rem_1fr_auto] sm:grid-cols-[5rem_8rem_1fr_auto] items-center gap-4 px-4 sm:px-6 py-3 hover:bg-elevated/50 transition-colors"
                >
                  <span class="font-semibold text-highlighted tabular-nums">{{ row.period }}</span>
                  <span class="tabular-nums">#{{ format(row.rank) }}</span>
                  <span class="hidden sm:block text-sm text-muted tabular-nums">
                    {{ format(row.mergedPullRequests) }} PRs · {{ format(row.issues) }} issues · {{ format(row.comments) }} comments
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
