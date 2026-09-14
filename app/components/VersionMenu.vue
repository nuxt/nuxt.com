<script setup lang="ts">
import { isVersionedDocsPath } from '#shared/utils/docs'

const { version, items } = useDocsVersion()
const { tags } = useDocsTags()
const route = useRoute()

const switchable = computed(() => isVersionedDocsPath(route.path))
</script>

<template>
  <UDropdownMenu
    v-slot="{ open }"
    :modal="false"
    :items="items"
    :content="{ align: 'start' }"
    :ui="{ content: 'min-w-fit' }"
    size="xs"
    :disabled="!switchable"
  >
    <UButton
      :label="`v${tags[version.shortTag]}`"
      variant="subtle"
      :trailing-icon="switchable ? 'i-lucide-chevron-down' : undefined"
      size="xs"
      :color="version.tagColor"
      :disabled="false"
      class="-mb-0.5 font-semibold text-[12px]/3 rounded-sm px-1.5 gap-0.5 truncate"
      :class="[!switchable && 'hover:bg-primary/10 active:bg-primary/10']"
      :ui="{
        trailingIcon: ['transition-transform duration-200 size-3', open && 'rotate-180']
      }"
    />
  </UDropdownMenu>
</template>
