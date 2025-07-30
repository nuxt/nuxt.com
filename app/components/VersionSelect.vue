<script setup lang="ts">
const { version, items } = useDocsVersion()
const { tags } = useDocsTags()
</script>

<template>
  <UDropdownMenu
    :modal="false"
    :items="items"
    :ui="{
      content: 'w-(--reka-dropdown-menu-trigger-width) min-w-0'
    }"
  >
    <template #default="{ open }">
      <UButton
        trailing-icon="i-lucide-chevron-down"
        color="neutral"
        variant="outline"
        block
        size="md"
        :class="[open && 'bg-elevated']"
        :ui="{
          trailingIcon: ['transition-transform duration-200', open ? 'rotate-180' : undefined].filter(Boolean).join(' ')
        }"
      >
        <span class="truncate">{{ version.label }}</span>

        <UBadge v-if="tags[version.shortTag]" :color="version.tagColor" variant="subtle" size="sm" class="rounded-full">
          {{ tags[version.shortTag] }}
        </UBadge>
      </UButton>
    </template>

    <template #item-label="{ item }">
      <div class="flex items-center gap-1.5">
        <span class="truncate">{{ item.label }}</span>

        <UBadge v-if="item.shortTag" :color="item.tagColor" variant="subtle" size="sm" class="rounded-full">
          {{ tags[item.shortTag] }}
        </UBadge>
      </div>
    </template>
  </UDropdownMenu>
</template>
