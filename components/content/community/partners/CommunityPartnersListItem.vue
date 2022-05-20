<template>
  <UCard padded shadow-class="" background-class="bg-transparent" class="relative transition duration-200 hover:ring-2 hover:u-ring-gray-900">
    <div class="flex flex-col">
      <div class="flex items-center h-32">
        <img v-if="partner.logo.light" :src="partner.logo.light" class="w-auto h-16 dark:hidden">
        <img v-if="partner.logo.dark" :src="partner.logo.dark" class="hidden w-auto h-16 dark:block">
        <img v-if="typeof partner.logo === 'string'" :src="partner.logo" class="w-auto h-16">
      </div>
      <div class="flex-1 w-full">
        <p class="text-xl font-semibold u-text-gray-700">
          {{ partner.title }}
        </p>
        <p class="mt-2 u-text-gray-500 line-clamp-2">
          {{ partner.description }}
        </p>
        <div v-if="partner.services?.length" class="inline-flex w-full gap-2 mt-4 overflow-y-auto">
          <span
            v-for="service in partner.services"
            :key="service.key"
            class="flex-shrink-0 px-4 py-2 rounded-lg u-bg-gray-100 u-text-gray-500"
          >
            {{ service.title }}
          </span>
        </div>
      </div>
    </div>

    <NuxtLink v-if="partner?.link" :to="partner.link" target="_blank" class="focus:outline-none" tabindex="-1">
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
