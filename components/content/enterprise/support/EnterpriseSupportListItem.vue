<script setup lang="ts">
defineProps<{
  icon: string
}>()
</script>

<template>
  <div class="flex flex-col sm:flex-row items-center gap-4 mb-8">
    <div class="w-14 h-14 bg-gray-100 dark:bg-gray-800 ring-1 ring-gray-300 dark:ring-gray-700 rounded-md flex items-center justify-center">
      <UIcon :name="icon" class="w-8 h-8" />
    </div>

    <div>
      <h2 class="text-lg font-semibold my-0">
        <ContentSlot :use="$slots.title" unwrap="p" />
      </h2>

      <p class="text-gray-500 dark:text-gray-400 text-base mt-1 mb-0">
        <ContentSlot :use="$slots.description" unwrap="p" />
      </p>
    </div>
  </div>
</template>
