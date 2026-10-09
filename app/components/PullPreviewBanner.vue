<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import type { PullPreviewSummary } from '#shared/types'
import { pullApiPath, type PullTarget } from '#shared/utils/pull'

const props = defineProps<{ pull: PullTarget }>()

const route = useRoute()

const { data: preview, error } = await useFetch<PullPreviewSummary>(pullApiPath(props.pull))

if (error.value) {
  throw createError({ status: 404, statusText: error.value.statusText || 'Preview not found', fatal: true })
}

const pageItems = computed<DropdownMenuItem[]>(() => (preview.value?.pages ?? []).map(page => ({
  label: page.title,
  to: page.path,
  checked: page.path === route.path,
  type: 'checkbox' as const
})))
</script>

<template>
  <UBanner
    v-if="preview"
    icon="i-lucide-git-pull-request"
    :ui="{
      root: 'bg-primary/10 border-b border-primary/25',
      icon: 'size-4 text-primary',
      title: 'flex items-center gap-2 min-w-0 text-default font-normal',
      actions: 'gap-1 ms-2'
    }"
  >
    <template #title>
      <span class="font-semibold text-highlighted shrink-0 hidden sm:inline">Preview</span>
      <UBadge :label="`${preview.repo}#${preview.number}`" color="primary" variant="subtle" size="sm" class="shrink-0" />
      <span class="truncate text-muted hidden sm:inline">{{ preview.title }}</span>
    </template>

    <template #actions>
      <UDropdownMenu v-if="pageItems.length" :items="pageItems" :content="{ align: 'end' }">
        <UButton
          icon="i-lucide-file-diff"
          trailing-icon="i-lucide-chevron-down"
          color="neutral"
          variant="outline"
          size="xs"
          :aria-label="`${pageItems.length} changed ${pageItems.length === 1 ? 'page' : 'pages'}`"
        >
          <span class="hidden sm:inline">{{ pageItems.length }} changed {{ pageItems.length === 1 ? 'page' : 'pages' }}</span>
        </UButton>
      </UDropdownMenu>

      <UTooltip text="View on GitHub">
        <UButton
          :to="preview.url"
          target="_blank"
          icon="i-simple-icons-github"
          color="neutral"
          variant="ghost"
          size="xs"
          aria-label="View on GitHub"
        />
      </UTooltip>

      <!-- `external` skips the router, whose base would keep the link in the preview. -->
      <UTooltip text="Exit preview">
        <UButton
          :to="route.fullPath"
          external
          icon="i-lucide-x"
          color="neutral"
          variant="ghost"
          size="xs"
          aria-label="Exit preview"
        />
      </UTooltip>
    </template>
  </UBanner>
</template>
