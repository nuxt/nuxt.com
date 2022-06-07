<template>
  <UCard padded shadow-class="" class="relative transition duration-200 hover:ring-2 hover:u-ring-gray-900">
    <div class="mt-2 mb-6">
      <img v-if="partner.logo.light" :src="partner.logo.light" :alt="partner.title" class="w-auto h-12 dark:hidden">
      <img v-if="partner.logo.dark" :src="partner.logo.dark" :alt="partner.title" class="hidden w-auto h-12 dark:block">
      <img v-if="typeof partner.logo === 'string'" :src="partner.logo" :alt="partner.title" class="w-auto h-12">
    </div>

    <div>
      <p class="text-xl font-semibold u-text-gray-700">
        {{ partner.title }}
      </p>
      <p class="mt-2 u-text-gray-500 line-clamp-2">
        {{ partner.description }}
      </p>
    </div>

    <NuxtLink :to="partner._path" class="focus:outline-none" tabindex="-1">
      <span class="absolute inset-0" aria-hidden="true" />
    </NuxtLink>
  </UCard>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'

defineProps({
  partner: {
    type: Object as PropType<Object>,
    default: () => null
  }
})
</script>
