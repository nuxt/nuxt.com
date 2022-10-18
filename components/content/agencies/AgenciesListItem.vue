<template>
  <UCard padded shadow-class="" class="relative transition duration-200 hover:ring-2 hover:u-ring-gray-900">
    <div class="flex justify-between mt-2 mb-6">
      <img v-if="partner.logo.light" :src="partner.logo.light" :alt="partner.title" class="w-auto h-12 dark:hidden">
      <img v-if="partner.logo.dark" :src="partner.logo.dark" :alt="partner.title" class="hidden w-auto h-12 dark:block">
      <div v-if="partner.location" class="ml-3 text-sm u-text-gray-400">
        {{ partner.location.title }}
      </div>
    </div>

    <div class="mb-6">
      <p class="text-xl font-semibold u-text-gray-700">
        {{ partner.title }}
      </p>
      <p class="mt-2 u-text-gray-500 line-clamp-2">
        {{ partner.description }}
      </p>
    </div>

    <div class="flex items-center gap-3 overflow-x-auto z-[1] relative">
      <UBadge v-for="service in partner.services" :key="service.key" size="sm" class="flex-shrink-0">
        {{ service.title }}
      </UBadge>
    </div>

    <NuxtLink :to="partner._path" tabindex="-1">
      <span class="absolute inset-0" aria-hidden="true" />
    </NuxtLink>
  </UCard>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { FormattedCommunityPartner } from '~/types'

defineProps({
  partner: {
    type: Object as PropType<FormattedCommunityPartner>,
    default: () => null
  }
})
</script>
