<script setup lang="ts">
import type { Module, Nuxter, NuxterPeriodStats, NuxterProfilePage, NuxtersPeriod } from '#shared/types'
import { isNuxtersPeriod, nuxterForPeriod, nuxterGithubSearchUrl, nuxterHackathons, nuxtersPeriodPhrase } from '#shared/utils/nuxters'

definePageMeta({
  heroBackground: 'opacity-30 -z-10'
})

const route = useRoute()
const param = String(route.params.username)

// The profile has every period: switching period needs no request.
const { data: nuxter } = await useFetch<NuxterProfilePage>(`/api/nuxters/${param}`, {
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
// By GitHub id: still the owner after a username change.
const { user } = useUserSession()
const isOwner = computed(() => !!user.value && user.value.providerId === String(nuxter.value?.githubId))
const username = nuxter.value.username
const hackathons = computed(() => nuxterHackathons(nuxter.value?.githubId))

// Links set on the GitHub profile, collected nightly by nuxt/nuxters.
const socialIcons: Record<string, string> = {
  twitter: 'i-simple-icons-x',
  bluesky: 'i-simple-icons-bluesky',
  linkedin: 'i-simple-icons-linkedin',
  mastodon: 'i-simple-icons-mastodon',
  youtube: 'i-simple-icons-youtube',
  twitch: 'i-simple-icons-twitch',
  instagram: 'i-simple-icons-instagram',
  facebook: 'i-simple-icons-facebook',
  threads: 'i-simple-icons-threads',
  reddit: 'i-simple-icons-reddit',
  npm: 'i-simple-icons-npm'
}
const displayName = computed(() => nuxter.value?.links?.name || nuxter.value.username)
const links = computed(() => {
  const username = nuxter.value!.username
  const profile = nuxter.value?.links
  const rel = 'me nofollow noopener noreferrer'
  const all = [
    { url: `https://github.com/${username}`, label: `github.com/${username}`, icon: 'i-simple-icons-github', rel: 'me noopener' },
    ...(profile?.website ? [{ url: profile.website, label: 'Website', icon: 'i-lucide-globe', rel }] : []),
    ...(profile?.socialAccounts ?? []).map(account => ({
      url: account.url,
      label: account.displayName,
      icon: socialIcons[account.provider] ?? 'i-lucide-link',
      rel
    }))
  ]
  // A website can also be a social account: one icon per URL, the first wins.
  return all.filter((link, index) => all.findIndex(other => other.url === link.url) === index)
})

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

const periodPhrase = nuxtersPeriodPhrase

const yearly = computed(() => (nuxter.value?.periods ?? []).filter(row => /^\d{4}$/.test(row.period)))
// Maintainers get full cards, as on /modules; contributions are compact links (150+ for some).
const maintained = computed(() => nuxter.value?.modules.maintained ?? [])
const contributed = computed(() => nuxter.value?.modules.contributed ?? [])
const blogPosts = computed(() => nuxter.value?.blogPosts ?? [])
// Long lists show their first rows, "Show all" expands them.
function usePreview<T>(items: Ref<T[]>, size: number) {
  const expanded = ref(false)
  const visible = computed(() => expanded.value ? items.value : items.value.slice(0, size))
  const more = computed(() => items.value.length > size)
  return reactive({ expanded, visible, more })
}
const maintainedPreview = usePreview(maintained, 8)
const blogPostsPreview = usePreview(blogPosts, 12)
const contributedPreview = usePreview(contributed, 12)

// Best rank; on a tie (#1 several years), the year with the most points.
const best = computed(() => yearly.value.reduce<typeof yearly.value[number] | undefined>((top, row) =>
  !top || row.rank < top.rank || (row.rank === top.rank && row.score > top.score) ? row : top, undefined))

// One look per contribution type, for the stat cards and the year rows.
// Same colors as the README card (OgImage/Nuxter.takumi.vue). Darker text in light mode, for contrast.
const METRICS = {
  // `hover` keeps the tint of the cards linked to GitHub, instead of the neutral hover of `UPageCard`.
  mergedPullRequests: { one: 'merged PR', many: 'merged PRs', icon: 'i-lucide-git-merge', tint: 'ring-primary bg-primary/5', hover: 'hover:ring-primary hover:bg-primary/10', text: 'text-primary' },
  issues: { one: 'issue', many: 'issues', icon: 'i-lucide-circle-dot', tint: 'ring-sky-400 bg-sky-400/5', hover: 'hover:ring-sky-400 hover:bg-sky-400/10', text: 'text-sky-600 dark:text-sky-400' },
  comments: { one: 'comment', many: 'comments', icon: 'i-lucide-message-circle', tint: 'ring-violet-400 bg-violet-400/5', hover: 'hover:ring-violet-400 hover:bg-violet-400/10', text: 'text-violet-600 dark:text-violet-400' },
  reactions: { one: 'reaction', many: 'reactions', icon: 'i-lucide-smile-plus', tint: 'ring-yellow-400 bg-yellow-400/5', text: 'text-amber-600 dark:text-yellow-400' }
} as const
type Metric = keyof typeof METRICS

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)
const metricLabel = (metric: Metric, value: number) => value === 1 ? METRICS[metric].one : METRICS[metric].many
const metricValue = (stats: Nuxter | NuxterPeriodStats, metric: Metric) => metric === 'mergedPullRequests' ? stats.mergedPullRequests.all : stats[metric]

// The day of the server render, in the payload: the page is cached for an hour and must hydrate with the same links.
const today = useState('nuxters-today', () => new Date().toISOString().slice(0, 10))
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
    detail: details[metric],
    // Reactions are received: GitHub cannot search them.
    github: metric === 'reactions'
      ? undefined
      : {
          url: nuxterGithubSearchUrl(username, metric, period.value, new Date(today.value)),
          hover: METRICS[metric].hover,
          label: metric === 'comments'
            ? `Issues and pull requests ${username} commented on, on GitHub`
            : `${capitalize(METRICS[metric].many)} of ${username} ${periodPhrase(period.value)}, on GitHub`
        }
  }))
})

// Shared links show the period on screen: title, description, `og:url` and card.
// The canonical URL has no `?period=`, so search engines see one page per profile.
const site = useSiteConfig()
const shareUrl = computed(() => `${site.url}/nuxters/${username}${period.value === 'all' ? '' : `?period=${period.value}`}`)
const title = computed(() => period.value === 'all'
  ? `${username} is a Nuxter`
  : `${username}: Nuxter #${format(current.value.rank)} ${periodPhrase(period.value)}`)
const description = computed(() => {
  const n = current.value
  if (period.value === 'all') {
    return `Discover ${username}'s contributions to the Nuxt ecosystem: #${format(n.rank)} with ${format(n.score)} points.`
  }
  const made = (['mergedPullRequests', 'issues', 'comments'] as const)
    .map(metric => `${format(metricValue(n, metric))} ${metricLabel(metric, metricValue(n, metric))}`)
  return `${username} made ${made[0]}, ${made[1]} and ${made[2]} to the Nuxt ecosystem ${periodPhrase(period.value)}: #${format(n.rank)} with ${format(n.score)} points.`
})
useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogUrl: shareUrl
})
useCanonical()
// No `period` for all time: its image URL stays the same as before periods existed.
defineOgImage('Nuxter.takumi', { username, period: () => period.value === 'all' ? undefined : period.value }, {
  // Stats change once a day
  cacheMaxAgeSeconds: 60 * 60
})
</script>

<template>
  <UPage v-if="nuxter">
    <UContainer class="pt-8">
      <!-- Back to the leaderboard of the period on screen -->
      <UButton
        :to="{ path: '/nuxters', query: { period } }"
        label="All Nuxters"
        icon="i-lucide-arrow-left"
        color="neutral"
        variant="link"
        class="px-0"
      />
    </UContainer>

    <!-- Profile on the left, stats on the right; stacked below lg -->
    <UContainer class="py-8 lg:py-20 scroll-mt-16">
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
                class="text-3xl sm:text-4xl font-bold text-highlighted truncate lg:leading-14"
                :title="displayName"
              >
                {{ displayName }}
              </h1>
              <p class="text-lg text-toned truncate -mt-1 lg:-mt-2">
                {{ nuxter.username }}
              </p>
              <!-- GitHub first, then the links set on it: those are never followed by crawlers, `me` for Mastodon verification -->
              <ul class="flex flex-wrap items-center gap-0.5 -ml-1.5" aria-label="Links">
                <li v-for="link in links" :key="link.url">
                  <UTooltip :text="link.label">
                    <UButton
                      :to="link.url"
                      target="_blank"
                      :rel="link.rel"
                      :icon="link.icon"
                      :aria-label="link.label"
                      color="neutral"
                      variant="ghost"
                      size="sm"
                      class="text-muted hover:text-highlighted"
                    />
                  </UTooltip>
                </li>
              </ul>
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
            <p v-if="best" class="text-sm lg:text-base text-muted">
              Best year: {{ best.period }}, #{{ format(best.rank) }} with {{ format(best.score) }} pts
            </p>
          </div>

          <div v-if="hackathons.length || maintained.length" class="flex flex-wrap gap-2">
            <UBadge
              v-for="hackathon in hackathons"
              :key="hackathon.id"
              :label="hackathon.name"
              icon="i-lucide-trophy"
              variant="subtle"
              class="lg:text-sm"
            />
            <UBadge
              v-if="maintained.length"
              label="Module author"
              icon="i-lucide-puzzle"
              color="neutral"
              variant="subtle"
              class="lg:text-sm"
            />
          </div>

          <!-- Only for the owner: the page is cached for everyone, so the session is checked in the browser.
               Sharing is a desktop action (copying Markdown into a GitHub README).
               An empty fallback: the default `<span>` would take a gap of the column until hydration. -->
          <ClientOnly>
            <div v-if="isOwner" class="hidden lg:block">
              <NuxtersShare :username="nuxter.username" :period="period" :periods="available" />
            </div>
            <template #fallback />
          </ClientOnly>
        </div>

        <div class="flex flex-col gap-4 lg:col-span-3 xl:col-span-2">
          <div class="flex flex-wrap items-center lg:justify-end gap-3">
            <NuxtersPeriodTabs
              :period="period"
              :periods="available"
              :to="value => ({ query: periodQuery(value) })"
              :rank="rankOf"
              aria-label="Profile period"
            />
          </div>

          <ul class="grid grid-cols-2 gap-4" :aria-label="`Contributions ${periodPhrase(period)}`">
            <li v-for="stat in stats" :key="stat.icon">
              <UPageCard
                :icon="stat.icon"
                variant="subtle"
                :to="stat.github?.url"
                :target="stat.github && '_blank'"
                :aria-label="stat.github?.label"
                :class="['h-full group', stat.tint, stat.github?.hover]"
                :ui="{ leadingIcon: stat.text }"
              >
                <UIcon
                  v-if="stat.github"
                  name="i-lucide-arrow-up-right"
                  class="absolute top-4 right-4 sm:top-6 sm:right-6 size-5 text-muted group-hover:text-highlighted transition-colors"
                />
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
        <div class="flex flex-col gap-12">
          <section v-if="maintained.length" aria-labelledby="maintained-modules">
            <h2 id="maintained-modules" class="text-2xl font-bold text-highlighted mb-1">
              Maintained modules
            </h2>
            <p class="text-muted mb-6">
              Maintainer of {{ maintained.length }} {{ maintained.length === 1 ? 'module' : 'modules' }} of the Nuxt ecosystem.
            </p>
            <UPageGrid class="lg:grid-cols-2 xl:grid-cols-4 gap-4">
              <!-- The card shape of /modules: the missing fields are only read by the project tools, off here -->
              <ModuleItem
                v-for="module in maintainedPreview.visible"
                :key="module.name"
                :module="module as Module"
                :is-added="false"
                :show-add-button="false"
                :show-badge="false"
              />
            </UPageGrid>
            <UButton
              v-if="maintainedPreview.more"
              :label="maintainedPreview.expanded ? 'Show less' : `Show all ${maintained.length}`"
              :trailing-icon="maintainedPreview.expanded ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
              color="neutral"
              variant="ghost"
              class="mt-4"
              @click="maintainedPreview.expanded = !maintainedPreview.expanded"
            />
          </section>

          <section v-if="contributed.length" aria-labelledby="contributed-modules">
            <h2 id="contributed-modules" class="text-2xl font-bold text-highlighted mb-1">
              Contributed to
            </h2>
            <p class="text-muted mb-6">
              Commits in {{ contributed.length }} {{ contributed.length === 1 ? 'module' : 'modules' }}{{ maintained.length ? ' maintained by others' : '' }}, by downloads.
            </p>
            <ul class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <li v-for="module in contributedPreview.visible" :key="module.name">
                <NuxtLink
                  :to="`/modules/${module.name}`"
                  class="flex items-center gap-3 rounded-lg px-3 py-2 ring ring-default hover:bg-elevated/50 transition-colors"
                >
                  <UAvatar
                    :src="moduleImage(module.icon)"
                    :icon="moduleIcon(module.category)"
                    :alt="module.name"
                    size="sm"
                    class="rounded-md bg-transparent"
                  />
                  <span class="min-w-0">
                    <span class="block font-medium text-sm text-highlighted truncate">{{ module.name }}</span>
                    <span class="block text-xs text-muted truncate">{{ module.npm }}</span>
                  </span>
                </NuxtLink>
              </li>
            </ul>
            <UButton
              v-if="contributedPreview.more"
              :label="contributedPreview.expanded ? 'Show less' : `Show all ${contributed.length}`"
              :trailing-icon="contributedPreview.expanded ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
              color="neutral"
              variant="ghost"
              class="mt-4"
              @click="contributedPreview.expanded = !contributedPreview.expanded"
            />
          </section>

          <section v-if="blogPosts.length" aria-labelledby="blog-posts">
            <h2 id="blog-posts" class="text-2xl font-bold text-highlighted mb-1">
              Blog posts
            </h2>
            <p class="text-muted mb-6">
              {{ blogPosts.length }} {{ blogPosts.length === 1 ? 'article' : 'articles' }} on the Nuxt blog.
            </p>
            <!-- The rows of contributed modules: 30+ full cards for some -->
            <ul class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <li v-for="post in blogPostsPreview.visible" :key="post.path">
                <NuxtLink
                  :to="post.path"
                  class="flex items-center gap-3 rounded-lg px-3 py-2 ring ring-default hover:bg-elevated/50 transition-colors"
                >
                  <NuxtImg
                    v-if="post.image"
                    :src="post.image"
                    width="57"
                    height="32"
                    densities="x1 x2"
                    :alt="`${post.title} image`"
                    loading="lazy"
                    class="h-8 aspect-video shrink-0 rounded-md object-cover"
                  />
                  <span class="min-w-0">
                    <span class="block font-medium text-sm text-highlighted truncate">{{ post.title }}</span>
                    <span class="block text-xs text-muted truncate">{{ formatDateByLocale('en', post.date) }}</span>
                  </span>
                </NuxtLink>
              </li>
            </ul>
            <UButton
              v-if="blogPostsPreview.more"
              :label="blogPostsPreview.expanded ? 'Show less' : `Show all ${blogPosts.length}`"
              :trailing-icon="blogPostsPreview.expanded ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
              color="neutral"
              variant="ghost"
              class="mt-4"
              @click="blogPostsPreview.expanded = !blogPostsPreview.expanded"
            />
          </section>
        </div>
      </UContainer>
    </UPageBody>
  </UPage>
</template>
