<template>
  <UCard padded shadow-class="" class="relative transition duration-200 hover:ring-2 ucard">
    <ModulesListItemCover :icon="module.icon" :alt="module.name" class="mt-2 mb-6" />

    <div class="flex items-center gap-1.5">
      <p class="text-lg font-semibold">
        {{ module.name }}
      </p>

      <div v-if="module.type === 'official'" class="flex items-center justify-center rounded-full bg-gradient-to-l from-green-400/30 via-teal-400/30 to-indigoblue-400/30 h-6 w-6">
        <Icon name="uil:medal" class="h-4 w-4 text-gray-900" />
      </div>
    </div>

    <p class="u-text-gray-500 text-sm line-clamp-2 sm:min-h-[40px] mb-4">
      {{ module.description }}
    </p>

    <div class="flex items-center justify-between gap-3 -mb-2 u-text-gray-500">
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-1.5">
          <Icon name="uil:star" class="w-4 h-4" />

          <span class="text-sm">{{ formatNumber(module.stars) }}</span>
        </div>
        <div class="flex items-center gap-1.5">
          <Icon name="uil:arrow-to-bottom" class="w-4 h-4" />

          <span class="text-sm">{{ formatNumber(module.downloads) }}</span>
        </div>
      </div>

      <div class="flex items-center gap-1.5">
        <Icon name="uil:users-alt" class="w-4 h-4" />

        <span class="text-sm">{{ module.contributors.length }}</span>
      </div>
    </div>

    <NuxtLink :to="`/modules/${module.name}`">
      <span class="absolute inset-0" aria-hidden="true" />
    </NuxtLink>
  </UCard>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { Module } from '~/types'
import { formatNumber } from '~/utils'

defineProps({
  module: {
    type: Object as PropType<Module>,
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
