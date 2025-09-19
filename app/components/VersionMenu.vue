<script setup lang="ts">
const { version, items } = useDocsVersion()
const { tags } = useDocsTags()
const route = useRoute()
</script>

<template>
  <UDropdownMenu
    v-slot="{ open }"
    :modal="false"
    :items="items"
    :content="{ align: 'start' }"
    :ui="{ content: 'min-w-fit' }"
    size="xs"
    :disabled="!route.path.startsWith('/docs')"
  >
    <UBadge
      :label="`v${tags[version.shortTag]}`"
      variant="subtle"
      :trailing-icon="route.path.startsWith('/docs') ? 'i-lucide-chevron-down' : undefined"
      size="sm"
      :color="version.tagColor"
      class="-mb-[2px] font-semibold text-[12px]/3 truncate"
      :ui="{
        trailingIcon: ['transition-transform duration-200', open ? 'rotate-180' : undefined].filter(Boolean).join(' ')
      }"
    />
  </UDropdownMenu>
</template>
