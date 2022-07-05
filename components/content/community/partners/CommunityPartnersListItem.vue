<template>
  <UCard padded shadow-class="" class="relative transition duration-200 hover:ring-2 hover:u-ring-gray-900">
    <div class="flex justify-between mt-2 mb-6">
      <img v-if="(partner.logo as CommunityPartnerLogo).light" :src="(partner.logo as CommunityPartnerLogo).light" :alt="partner.title" class="w-auto h-12 dark:hidden">
      <img v-if="(partner.logo as CommunityPartnerLogo).dark" :src="(partner.logo as CommunityPartnerLogo).dark" :alt="partner.title" class="hidden w-auto h-12 dark:block">
      <img v-if="typeof partner.logo === 'string'" :src="partner.logo" :alt="partner.title" class="w-auto h-12">
      <div class="ml-3 text-sm u-text-gray-400">
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

    <div class="flex flex-wrap gap-3">
      <UBadge v-for="service in partner.services" :key="service.key" size="sm">
        {{ service.title }}
      </UBadge>
    </div>

    <NuxtLink :to="partner._path" class="focus:outline-none" tabindex="-1">
      <span class="absolute inset-0" aria-hidden="true" />
    </NuxtLink>
  </UCard>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { FormatedCommunityPartner, CommunityPartnerLogo } from '~/types'

defineProps({
  partner: {
    type: Object as PropType<FormatedCommunityPartner>,
    default: () => null
  }
})
</script>
