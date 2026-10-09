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

// A removed page has nothing to open in the preview.
const pageItems = computed<DropdownMenuItem[]>(() => (preview.value?.pages ?? []).map(page => page.removed
  ? { label: page.title, disabled: true, ui: { itemLabel: 'line-through' } }
  : { label: page.title, to: page.path }))

const pagesLabel = computed(() => `${pageItems.value.length} ${pageItems.value.length === 1 ? 'page' : 'pages'} updated`)
</script>

<template>
  <div v-if="preview" class="relative z-50 bg-primary/10 border-b border-primary/25">
    <UContainer class="flex items-center justify-between gap-3 h-12">
      <div class="flex items-center gap-2 min-w-0 text-sm">
        <UIcon name="i-lucide-git-pull-request" class="size-4 shrink-0 text-primary" />
        <span class="font-semibold text-highlighted shrink-0 hidden sm:inline">Preview</span>

        <UButton
          :to="preview.url"
          target="_blank"
          :label="`${preview.repo}#${preview.number}`"
          icon="i-simple-icons-github"
          color="neutral"
          variant="outline"
          size="xs"
          class="min-w-0"
        />

        <UDropdownMenu v-if="pageItems.length" :items="pageItems" size="xs" :content="{ align: 'start' }">
          <UButton
            icon="i-lucide-file-diff"
            trailing-icon="i-lucide-chevron-down"
            color="neutral"
            variant="outline"
            size="xs"
            class="shrink-0"
            :aria-label="pagesLabel"
          >
            <span class="hidden sm:inline">{{ pagesLabel }}</span>
          </UButton>
        </UDropdownMenu>
      </div>

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
    </UContainer>
  </div>
</template>
