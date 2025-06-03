<script setup lang="ts">
const { version, items } = useDocsVersion()
</script>

<template>
  <UDropdownMenu
    v-slot="{ open }"
    :modal="false"
    :items="items"
    :ui="{ content: 'w-(--reka-dropdown-menu-trigger-width) min-w-0' }"
  >
    <UButton
      :label="version.label"
      variant="outline"
      trailing-icon="i-lucide-chevron-down"
      color="neutral"
      block
      size="md"
      :class="[open && 'bg-elevated']"
      :ui="{
        trailingIcon: ['transition-transform duration-200', open ? 'rotate-180' : undefined].filter(Boolean).join(' ')
      }"
    />
  </UDropdownMenu>
</template>
