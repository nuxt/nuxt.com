<script setup lang="ts">
import type { NuxtersPeriod } from '#shared/types'
import { nuxtersPeriodPhrase } from '#shared/utils/nuxters'

const props = defineProps<{
  username: string
  /** The link and the card share the period on screen (all time by default). */
  period?: NuxtersPeriod
}>()

const site = useSiteConfig()
const { copy } = useClipboard()

const query = computed(() => !props.period || props.period === 'all' ? '' : `?period=${props.period}`)
const profileUrl = computed(() => `${site.url}/nuxters/${props.username}${query.value}`)
const cardUrl = computed(() => `${site.url}/nuxters/${props.username}/card.png${query.value}`)
const alt = computed(() => `${props.username}'s Nuxter profile${query.value ? ` ${nuxtersPeriodPhrase(props.period!)}` : ''}`)
const markdown = computed(() => `[![${alt.value}](${cardUrl.value})](${profileUrl.value})`)
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <UButton
      label="Copy profile link"
      icon="i-lucide-link"
      color="neutral"
      variant="outline"
      @click="copy(profileUrl, { title: 'Profile link copied', icon: 'i-lucide-check' })"
    />

    <UModal
      title="Add your Nuxter card to GitHub"
      description="Paste this Markdown in your GitHub profile README. The card updates every day."
      :ui="{ content: 'sm:max-w-2xl' }"
    >
      <UButton label="Add to README" icon="i-lucide-id-card" color="neutral" variant="outline" />

      <template #body>
        <div class="flex flex-col gap-4">
          <img
            :src="cardUrl"
            :alt="`${username}'s Nuxter card`"
            width="1200"
            height="630"
            class="w-full aspect-[1200/630] rounded-md ring ring-default bg-muted"
          >
          <UTextarea :model-value="markdown" readonly :rows="3" class="font-mono" :ui="{ base: 'text-xs' }" />
          <div class="flex flex-wrap items-center justify-between gap-2">
            <ULink
              to="https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-github-profile/customizing-your-profile/managing-your-profile-readme"
              target="_blank"
              class="text-sm"
            >
              How to set up a profile README
            </ULink>
            <UButton
              label="Copy Markdown"
              icon="i-lucide-copy"
              @click="copy(markdown, { title: 'Markdown copied', icon: 'i-lucide-check' })"
            />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
