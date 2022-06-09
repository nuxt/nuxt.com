<template>
  <UCard body-class="p-0" base-class="transition-all duration-300 bg-white border-2 rounded-lg shadow-none dark:bg-black hover:border-gray-300 hover:dark:border-gray-500 hover:shadow-sm group ring-0">
    <NuxtLink :to="to" class="flex flex-col px-4 py-5 gap-y-5 sm:p-6">
      <div class="flex justify-between">
        <Component :is="icon" class="w-6 h-6 u-text-gray-900" />
        <Arrow class="pr-4 transition-all duration-300 opacity-0 u-text-gray-900 w-7 h-7 group-hover:translate-x-4 group-hover:opacity-100" />
      </div>
      <h6 class="text-2xl font-semibold u-text-gray-900">
        <Markdown :use="$slots.title" unwrap="p" />
      </h6>
      <p class="u-text-gray-900">
        <Markdown :use="$slots.description" unwrap="p" />
      </p>
    </NuxtLink>
  </UCard>
</template>

<script setup lang="ts">
defineProps({
  icon: {
    type: String,
    default: ''
  },
  to: {
    type: String,
    default: ''
  }
})
</script>
