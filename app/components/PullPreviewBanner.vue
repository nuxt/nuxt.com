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
    color="warning"
    :title="`Previewing ${preview.repo}#${preview.number}: ${preview.title}`"
  >
    <template #actions>
      <UDropdownMenu v-if="pageItems.length" :items="pageItems" :content="{ align: 'end' }">
        <UButton
          :label="`${pageItems.length} changed ${pageItems.length === 1 ? 'page' : 'pages'}`"
          color="neutral"
          variant="outline"
          size="xs"
          trailing-icon="i-lucide-chevron-down"
        />
      </UDropdownMenu>
      <UButton
        label="View on GitHub"
        :to="preview.url"
        target="_blank"
        color="neutral"
        variant="outline"
        size="xs"
        trailing-icon="i-lucide-arrow-up-right"
      />
      <!-- `external` skips the router, whose base would keep the link in the preview. -->
      <UButton
        label="Exit preview"
        :to="route.fullPath"
        external
        color="neutral"
        variant="outline"
        size="xs"
        trailing-icon="i-lucide-x"
      />
    </template>
  </UBanner>
</template>
