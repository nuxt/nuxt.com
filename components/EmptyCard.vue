<script setup lang="ts">
withDefaults(defineProps<{
  label: string
}>(), {
  label: 'No results found.'
})
</script>

<template>
  <UCard>
    <div class="flex flex-col items-center py-12">
      <UIcon name="i-ph-magnifying-glass-duotone" class="w-16 h-16 mx-auto text-muted mb-4" aria-hidden="true" />

      <p class="text-lg text-center text-subdued max-w-sm" v-html="label" />

      <div class="flex items-center gap-3 mt-6">
        <slot />
      </div>
    </div>
  </UCard>
</template>
