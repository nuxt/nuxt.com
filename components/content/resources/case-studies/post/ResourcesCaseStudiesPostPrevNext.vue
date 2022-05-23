<template>
  <div class="flex items-center justify-between gap-4 px-4 sm:px-0">
    <div v-if="prev" class="relative w-1/2 px-6 py-4 overflow-hidden transition duration-200 rounded-lg lg:w-56 ring-1 u-ring-gray-200 lg:hover:u-ring-gray-900 lg:hover:ring-2 group u-bg-white">
      <div class="flex items-center justify-between gap-1">
        <UIcon name="heroicons-outline:arrow-sm-left" class="flex-shrink-0 w-5 h-5" />

        <div class="min-w-0 text-right">
          <p class="font-semibold lg:text-lg u-text-gray-900">
            Previous case
          </p>
          <p class="truncate u-text-gray-600">
            {{ prev.title }} study
          </p>
        </div>
      </div>
      <NuxtLink :to="prev._path" tabindex="-1" class="focus:outline-none">
        <span class="absolute inset-0" aria-hidden="true" />
      </NuxtLink>
    </div>
    <span v-else>&nbsp;</span>

    <div v-if="next" class="relative w-1/2 px-6 py-4 overflow-hidden transition duration-200 rounded-lg lg:w-56 ring-1 u-ring-gray-200 lg:hover:u-ring-gray-900 lg:hover:ring-2 group u-bg-white">
      <div class="flex items-center justify-between gap-1">
        <div class="min-w-0">
          <p class="font-semibold lg:text-lg u-text-gray-900">
            Next case
          </p>
          <p class="truncate u-text-gray-600">
            {{ next.title }} study
          </p>
        </div>

        <UIcon name="heroicons-outline:arrow-sm-right" class="flex-shrink-0 w-5 h-5" />
      </div>
      <NuxtLink :to="next._path" tabindex="-1" class="focus:outline-none">
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
