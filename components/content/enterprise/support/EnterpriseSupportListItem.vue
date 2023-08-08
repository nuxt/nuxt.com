<script setup lang="ts">
defineProps<{
  icon: string
}>()
</script>

<template>
  <div class="flex flex-col sm:flex-row items-center gap-4 mb-8">
    <div class="w-14 h-14 bg-surface ring-1 ring-overlay rounded-md flex items-center justify-center">
      <UIcon :name="icon" class="w-8 h-8" />
    </div>

    <div>
      <h2 class="text-highlight text-lg font-semibold my-0">
        <ContentSlot :use="$slots.title" unwrap="p" />
      </h2>

      <p class="text-subdued text-base mt-1 mb-0">
        <ContentSlot :use="$slots.description" unwrap="p" />
      </p>
    </div>
  </div>
</template>
