
<template>
  <UCard padded shadow-class="" class="relative transition duration-200 hover:ring-2 ucard">
    <div class="flex justify-between mt-2 mb-6">
      <img v-if="partner.logo?.light" :src="partner.logo.light" :alt="partner.title" class="w-auto h-12 dark:hidden">
      <img v-if="partner.logo?.dark" :src="partner.logo.dark" :alt="partner.title" class="hidden w-auto h-12 dark:block">
      <div v-if="partner.location" class="ml-3 text-sm u-text-gray-400">
        {{ partner.location.title }}
      </div>
    </div>

    <div class="mb-2">
      <p class="text-xl font-semibold u-text-gray-700">
        {{ partner.title }}
      </p>
      <p class="mt-2 u-text-gray-500 line-clamp-3">
        {{ partner.description }}
      </p>
    </div>

    <NuxtLink :to="partner._path" :title="partner.title">
      <span class="absolute inset-0" aria-hidden="true" />
    </NuxtLink>
  </UCard>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { Agency } from '../../types'

defineProps({
  partner: {
    type: Object as PropType<Agency>,
    default: () => null
  }
})
</script>

<style scoped lang="postcss">
.ucard:hover {
  --tw-ring-color: #00dc82
}

.ucard:has(a:focus-visible) {
  @apply ring-2;
  --tw-ring-color: #00dc82
}
</style>
