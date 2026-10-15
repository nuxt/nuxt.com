<script setup lang="ts">
defineOptions({ inheritAttrs: false })

const props = defineProps<{
  username: string
  name?: string
  periodPhrase?: string
  rank: number
  score: number
  mergedPullRequests: number
  issues: number
  comments: number
  reactions: number
  maintainedModules: number
  contributedModules: number
  hackathons: string[]
  path: string
}>()

const { format } = new Intl.NumberFormat('en-US')

// Same icons and colors as the profile page and the README card.
const stats = computed(() => [
  { label: props.mergedPullRequests === 1 ? 'merged PR' : 'merged PRs', value: props.mergedPullRequests, icon: 'i-lucide-git-merge', text: 'text-primary' },
  { label: props.issues === 1 ? 'issue' : 'issues', value: props.issues, icon: 'i-lucide-circle-dot', text: 'text-sky-600 dark:text-sky-400' },
  { label: props.comments === 1 ? 'comment' : 'comments', value: props.comments, icon: 'i-lucide-message-circle', text: 'text-violet-600 dark:text-violet-400' },
  { label: props.reactions === 1 ? 'reaction' : 'reactions', value: props.reactions, icon: 'i-lucide-smile-plus', text: 'text-amber-600 dark:text-yellow-400' }
])

const modules = computed(() => [
  props.maintainedModules && `Maintains ${props.maintainedModules} ${props.maintainedModules === 1 ? 'module' : 'modules'}`,
  props.contributedModules && `contributed to ${props.contributedModules} more`
].filter(Boolean).join(', '))
</script>

<template>
  <div class="flex flex-col rounded-lg border border-default bg-elevated/50 overflow-hidden">
    <NuxtLink :to="path" class="flex items-center gap-3 p-3 hover:bg-elevated transition-colors">
      <!-- UAvatar renders with <NuxtImg> (IPX): the source path, not an IPX URL -->
      <UAvatar
        :src="`/gh_avatar/${username}`"
        :alt="username"
        size="lg"
        class="rounded-md shrink-0"
      />
      <div class="min-w-0 flex-1">
        <p class="text-sm font-semibold text-highlighted truncate">
          {{ name || username }}
          <span v-if="name" class="font-normal text-muted">@{{ username }}</span>
        </p>
        <p class="text-xs text-muted tabular-nums">
          {{ periodPhrase ? `#${format(rank)} ${periodPhrase}` : `Nuxter #${format(rank)}` }}
          · <span class="font-medium text-highlighted">{{ format(score) }}</span> pts
        </p>
      </div>
    </NuxtLink>

    <ul class="grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-1.5 px-3 pb-3 text-xs text-muted" aria-label="Contributions">
      <li v-for="stat in stats" :key="stat.icon" class="flex items-center gap-1.5 min-w-0">
        <UIcon :name="stat.icon" class="size-3.5 shrink-0" :class="stat.text" aria-hidden="true" />
        <span class="truncate"><span class="font-medium text-highlighted tabular-nums">{{ format(stat.value) }}</span> {{ stat.label }}</span>
      </li>
    </ul>

    <div class="flex items-center gap-2 px-3 py-1.5 border-t border-default">
      <div class="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-muted flex-1 min-w-0">
        <span v-if="modules" class="flex items-center gap-1">
          <UIcon name="i-lucide-puzzle" class="size-3" />
          {{ modules }}
        </span>
        <span v-for="hackathon in hackathons" :key="hackathon" class="flex items-center gap-1">
          <UIcon name="i-lucide-trophy" class="size-3" />
          {{ hackathon }}
        </span>
      </div>

      <UButton
        icon="i-lucide-arrow-right"
        label="Profile"
        size="xs"
        color="primary"
        variant="soft"
        :to="path"
      />
    </div>
  </div>
</template>
