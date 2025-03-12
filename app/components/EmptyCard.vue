<script setup lang="ts">
withDefaults(defineProps<{
  label: string
}>(), {
  label: 'No results found.'
})
</script>

<template>
  <UCard variant="subtle">
    <div class="flex flex-col items-center py-12">
      <UIcon name="i-lucide-search" class="w-16 h-16 mx-auto text-(--ui-text-muted) mb-4" aria-hidden="true" />

      <p class="text-lg text-center max-w-sm">
        {{ label }}
      </p>

      <div class="flex items-center gap-3 mt-6">
        <slot />
      </div>
    </div>
  </UCard>
</template>
