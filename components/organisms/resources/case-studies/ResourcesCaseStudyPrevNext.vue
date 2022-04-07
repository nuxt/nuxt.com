<template>
  <div class="flex items-center justify-between px-4 sm:px-0">
    <div v-if="prev" class="ring-1 u-ring-gray-200 lg:hover:u-ring-gray-900 lg:hover:ring-2 group rounded-lg u-bg-white overflow-hidden relative px-6 py-3">
      <div class="flex items-center justify-between gap-6">
        <UIcon name="heroicons-outline:arrow-sm-left" class="w-5 h-5" />

        <div>
          <p class="text-lg font-semibold u-text-gray-900">
            Previous case
          </p>
          <p class="u-text-gray-600">
            {{ prev.title }} study
          </p>
        </div>
      </div>
      <NuxtLink :to="prev.slug" tabindex="-1" class="focus:outline-none">
        <span class="absolute inset-0" aria-hidden="true" />
      </NuxtLink>
    </div>
    <span v-else>&nbsp;</span>

    <div v-if="next" class="ring-1 u-ring-gray-200 lg:hover:u-ring-gray-900 lg:hover:ring-2 group rounded-lg u-bg-white overflow-hidden relative px-6 py-3">
      <div class="flex items-center justify-between gap-6">
        <div>
          <p class="text-lg font-semibold u-text-gray-900">
            Next case
          </p>
          <p class="u-text-gray-600">
            {{ next.title }} study
          </p>
        </div>

        <UIcon name="heroicons-outline:arrow-sm-right" class="w-5 h-5" />
      </div>
      <NuxtLink :to="next.slug" tabindex="-1" class="focus:outline-none">
        <span class="absolute inset-0" aria-hidden="true" />
      </NuxtLink>
    </div>
    <span v-else>&nbsp;</span>
  </div>
</template>

<script setup>
defineProps({
  prev: {
    type: Object,
    default: null
  },
  next: {
    type: Object,
    default: null
  }
})
</script>
