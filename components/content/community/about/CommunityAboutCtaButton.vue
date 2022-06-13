<template>
  <UCard padded body-class="" shadow-class="" class="relative transition duration-200 group hover:ring-2 hover:u-ring-gray-900">
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
