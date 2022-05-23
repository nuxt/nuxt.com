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
      <div v-if="partner.services?.length" class="inline-flex w-full gap-2 mt-4 overflow-x-auto z-[1] relative -mb-2">
        <span
          v-for="service in partner.services"
          :key="service.key"
          class="flex-shrink-0 px-2 py-1 text-xs border rounded-lg u-border-gray-200 u-text-gray-500"
        >
          {{ service.title }}
        </span>
      </div>
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
