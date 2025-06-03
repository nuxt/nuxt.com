<script setup lang="ts">
const { version, items } = useDocsVersion()
</script>

<template>
  <UDropdownMenu
    :modal="false"
    :items="items"
    :ui="{
      content: 'w-(--reka-dropdown-menu-trigger-width) min-w-0'
    }"
  >
    <UButton
      variant="outline"
      color="neutral"
      size="lg"
      block
      class="justify-between font-medium min-w-0"
      trailing-icon="i-lucide-chevrons-up-down"
    >
      <div class="flex items-center gap-2 min-w-0 flex-1">
        <UIcon name="i-lucide-layers" class="size-4 text-primary shrink-0" />
        <span class="truncate text-sm">{{ version.label }}</span>
        <UBadge
          :label="version.version"
          variant="subtle"
          color="primary"
          size="sm"
          class="text-[12px]/3"
        />
      </div>
    </UButton>
    <template #item-leading="{ item, active }">
      <UButton
        square
        :icon="item.version === '4.x' ? 'i-lucide-rocket' : 'i-lucide-check-circle-2'"
        :color="active === false ? 'neutral' : 'primary'"
        variant="outline"
        size="sm"
      />
    </template>
    <template #item-label="{ item }">
      <div class="flex flex-col ml-1">
        <span class="font-medium text-sm truncate">{{ item.label }}</span>
        <span class="text-sm text-muted">
          {{ item.version }}
        </span>
      </div>
    </template>
  </UDropdownMenu>
</template>
