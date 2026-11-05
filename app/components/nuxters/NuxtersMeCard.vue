<script setup lang="ts">
import type { NuxterMe } from '#shared/types'
import { NUXTERS_ME_CARD_CLASS } from '~/utils/nuxters-me-card'
import { NUXTERS_HACKATHONS } from '#shared/utils/nuxters'

// The session loads client-side (`auth.loadStrategy`): until `ready`, the visitor may be signed in.
const { loggedIn, ready } = useUserSession()
const route = useRoute()
const toast = useToast()
const { format } = new Intl.NumberFormat('en-US')

// Not awaited: the card mounts after hydration (ClientOnly), an await would render nothing until the
// request ends. The skeleton shows instead, at the same height.
const { data: me, status } = useFetch<NuxterMe>('/api/me/nuxter', {
  key: 'nuxters-me',
  server: false,
  immediate: loggedIn.value,
  watch: [loggedIn]
})

const lastYear = computed(() => me.value?.nuxter?.periods.find(row => row.period === '12m'))

const unlocks = computed(() => {
  const nuxter = me.value?.nuxter
  return [
    { label: 'merged pull requests', value: nuxter?.mergedPullRequests.all ?? 0 },
    { label: 'helpful issues', value: nuxter?.helpfulIssues ?? 0, hint: 'Completed, or 3+ reactions, or 5+ comments' },
    { label: 'helpful comments', value: nuxter?.helpfulComments ?? 0, hint: '3+ reactions' }
  ]
})

const roleLabels: Record<string, string> = {
  nuxter: 'Nuxter',
  moduleAuthor: 'Module Author',
  ...Object.fromEntries(NUXTERS_HACKATHONS.map(hackathon => [hackathon.id, hackathon.name]))
}

const badges = computed(() => {
  const badges = me.value?.badges
  if (!badges) return []
  return [
    ...(badges.nuxter ? ['nuxter'] : []),
    ...(badges.moduleAuthor ? ['moduleAuthor'] : []),
    ...badges.hackathons
  ].map(key => roleLabels[key] ?? key)
})

onMounted(() => {
  if (route.query.discord === 'linked') {
    toast.add({ title: 'Discord linked', description: 'Your roles are now on the Nuxt Discord server.', icon: 'i-simple-icons-discord', color: 'success' })
  } else if (route.query.discord === 'error') {
    toast.add({ title: 'Discord link failed', description: 'Please try again.', icon: 'i-simple-icons-discord', color: 'error' })
  }
})
</script>

<template>
  <!-- Loading shows NuxtersMeCardSkeleton: same card and minimum height, the hero does not move -->
  <NuxtersMeCardSkeleton v-if="!ready || (loggedIn && (status !== 'success' || !me))" />
  <!-- A flex column (the container is a grid from lg): the signed-out content centers in the reserved height -->
  <UPageCard v-else variant="subtle" :class="NUXTERS_ME_CARD_CLASS" :ui="{ container: 'flex flex-col lg:flex' }">
    <div v-if="!loggedIn || !me" class="flex flex-col items-center gap-4 my-auto text-center">
      <UIcon name="i-simple-icons-github" class="size-8" />
      <p class="text-lg font-medium text-highlighted">
        Discover your contributions
      </p>
      <p class="text-muted max-w-sm -mt-2">
        Sign in with GitHub to see your score, share your Nuxter profile and unlock your badges.
      </p>
      <UButton
        label="Sign in with GitHub"
        color="neutral"
        icon="i-simple-icons-github"
        to="/api/auth/github?redirect=/nuxters"
        external
      />
    </div>

    <div v-else class="flex flex-col gap-6">
      <div class="flex items-center gap-4">
        <NuxtImg
          :src="`/gh_avatar/${me.username}`"
          provider="ipx"
          densities="x1 x2"
          width="64"
          height="64"
          format="auto"
          :alt="me.username"
          class="size-16 rounded-full bg-muted"
        />
        <div class="flex-1 min-w-0">
          <p class="text-lg font-semibold text-highlighted truncate">
            {{ me.username }}
          </p>
          <p v-if="me.nuxter" class="flex items-center gap-1 text-muted">
            <span class="tabular-nums">#{{ format(me.nuxter.rank) }}</span>
            <span>·</span>
            <span class="tabular-nums">{{ format(me.nuxter.score) }} pts</span>
            <NuxtersScoreBreakdown :nuxter="me.nuxter" />
          </p>
          <p v-else class="text-muted">
            No contributions on record yet.
          </p>
          <p v-if="lastYear" class="text-sm text-muted">
            Last 12 months: <span class="tabular-nums">#{{ format(lastYear.rank) }}</span>
          </p>
        </div>
        <UButton
          v-if="me.nuxter"
          :to="`/nuxters/${me.nuxter.username}`"
          label="My profile"
          trailing-icon="i-lucide-arrow-right"
          color="neutral"
          variant="outline"
        />
      </div>

      <ul class="flex flex-col gap-2">
        <li v-for="item in unlocks" :key="item.label" class="flex items-center gap-2">
          <UIcon
            :name="item.value > 0 ? 'i-lucide-circle-check' : 'i-lucide-circle'"
            class="size-5 shrink-0"
            :class="item.value > 0 ? 'text-primary' : 'text-dimmed'"
          />
          <span><span class="font-medium text-highlighted tabular-nums">{{ format(item.value) }}</span> {{ item.label }}</span>
          <UTooltip v-if="item.hint" :text="item.hint">
            <UIcon name="i-lucide-info" class="size-4 text-dimmed" />
          </UTooltip>
        </li>
      </ul>

      <div class="flex flex-wrap items-center gap-2">
        <template v-if="badges.length">
          <UBadge
            v-for="badge in badges"
            :key="badge"
            :label="badge"
            icon="i-lucide-award"
            variant="subtle"
          />
        </template>
        <p v-else class="text-sm text-muted">
          One merged PR, helpful issue or helpful comment unlocks the Nuxter badge.
        </p>
      </div>

      <!-- One row of actions, unlocked with a badge: the card keeps its height with or without Discord.
           Sharing is the all-time profile: the card does not follow the leaderboard period. -->
      <div v-if="me.nuxter && badges.length" class="flex flex-wrap items-center gap-2 pt-4 border-t border-default">
        <UTooltip v-if="me.discord.enabled" :text="me.discord.username ? `Linked as ${me.discord.username}` : 'Get your roles on the Nuxt Discord server'">
          <UButton
            :label="me.discord.username ? 'Sync Discord roles' : 'Unlock Discord roles'"
            icon="i-simple-icons-discord"
            color="neutral"
            :variant="me.discord.username ? 'soft' : 'solid'"
            size="sm"
            to="/api/auth/discord"
            external
          />
        </UTooltip>
        <NuxtersShare :username="me.nuxter.username" :periods="me.nuxter.periods.map(row => row.period)" class="contents" />
      </div>
    </div>
  </UPageCard>
</template>
