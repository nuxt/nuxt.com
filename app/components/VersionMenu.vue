<script setup lang="ts">
const { version, items } = useDocsVersion()
const { tags } = useDocsTags()
</script>

<template>
  <UDropdownMenu
    v-slot="{ open }"
    :modal="false"
    :items="items"
    :content="{ align: 'start' }"
    :ui="{ content: 'min-w-fit' }"
    size="xs"
  >
    <UButton
      :label="tags[version.shortTag]"
      variant="subtle"
      trailing-icon="i-lucide-chevron-down"
      size="xs"
      :color="version.tagColor"
      class="-mb-[3px] font-semibold rounded-full truncate"
      :ui="{
        trailingIcon: ['transition-transform duration-200', open ? 'rotate-180' : undefined].filter(Boolean).join(' ')
      }"
    />
  </UDropdownMenu>
</template>
