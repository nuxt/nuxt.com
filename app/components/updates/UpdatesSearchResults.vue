<script setup lang="ts">
import type { BlogSearchMatch, UpdatesTimelineItem } from '~/composables/useUpdates'

const props = defineProps<{
  query: string
  articles: BlogSearchMatch[]
  releases: UpdatesTimelineItem[]
  searching: boolean
}>()

defineEmits<{
  clear: []
}>()

const { open: openAgent } = useNuxtAgent()

const total = computed(() => props.articles.length + props.releases.length)

const summary = computed(() => {
  if (props.searching && !total.value) return 'Searching…'
  return `${total.value} ${total.value === 1 ? 'result' : 'results'} for “${props.query}”`
})

function articleLink({ post, result }: BlogSearchMatch) {
  return `${post.path}${result.section ? `#${result.section.id}` : ''}`
}
</script>

<template>
  <div class="flex flex-col gap-10">
    <div class="flex flex-col">
      <p class="text-sm text-muted" aria-live="polite">
        {{ summary }}
      </p>

      <ul v-if="total" class="flex flex-col divide-y divide-default">
        <li v-for="item in articles" :key="item.post.path">
          <NuxtLink
            :to="articleLink(item)"
            class="group grid items-start gap-x-8 gap-y-4 py-6 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary sm:grid-cols-[minmax(0,1fr)_10rem]"
          >
            <div class="flex min-w-0 flex-col gap-1.5">
              <p class="text-sm text-muted">
                {{ item.post.category }} · {{ formatShortDate(item.post.date) }}
              </p>
              <h3 class="text-lg text-highlighted transition-colors group-hover:text-primary">
                <UpdatesHighlight :text="item.post.title" :query="query" />
              </h3>
              <p v-if="item.result.section" class="flex items-center gap-1.5 text-sm text-toned">
                <UIcon name="i-lucide-hash" class="size-3.5 shrink-0" />
                <span class="truncate"><UpdatesHighlight :text="item.result.section.title" :query="query" /></span>
              </p>
              <p class="line-clamp-2 text-muted" :class="{ 'font-mono text-sm': item.result.code }">
                <UpdatesHighlight :text="item.result.snippet" :query="query" />
              </p>
            </div>
            <NuxtImg
              v-if="item.post.image"
              :src="item.post.image"
              :alt="`${item.post.title} cover`"
              width="320"
              height="180"
              class="hidden aspect-video w-full rounded-md object-cover sm:block"
            />
          </NuxtLink>
        </li>

        <li v-for="release in releases" :key="release.key">
          <NuxtLink
            :to="release.to"
            :target="release.external ? '_blank' : undefined"
            class="group flex flex-col gap-1.5 py-6 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
          >
            <p class="text-sm text-muted">
              Changelog · {{ formatShortDate(release.date) }}
            </p>
            <h3 class="flex items-center gap-1.5 text-lg text-highlighted transition-colors group-hover:text-primary">
              <UpdatesHighlight :text="release.title" :query="query" />
              <UIcon v-if="release.external" name="i-lucide-arrow-up-right" class="size-4 shrink-0 text-dimmed" />
            </h3>
            <p class="line-clamp-2 text-muted">
              <UpdatesHighlight :text="release.description" :query="query" />
            </p>
          </NuxtLink>
        </li>
      </ul>
    </div>

    <div v-if="!searching || total" class="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-muted p-5">
      <p class="text-muted">
        {{ total ? 'Looking for an answer rather than an article?' : 'No article or release mentions it.' }} Ask Nuxi about “{{ query }}”.
      </p>
      <div class="flex items-center gap-2">
        <UButton v-if="!total" label="Clear Search" color="neutral" variant="ghost" @click="$emit('clear')" />
        <UButton label="Ask Nuxi" color="neutral" variant="subtle" @click="openAgent(query)">
          <template #leading>
            <AgentNuxiIcon class="size-4 text-primary" :interactive="false" />
          </template>
        </UButton>
      </div>
    </div>
  </div>
</template>
