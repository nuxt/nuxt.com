<template>
  <UCard padded shadow-class="" class="relative transition duration-200 hover:ring-2 hover:u-ring-gray-900">
    <ModulesListItemCover :icon="module.icon" :alt="module.name" class="mt-2 mb-6" />

    <div class="flex items-center gap-1.5">
      <p class="text-lg font-semibold">
        {{ module.name }}
      </p>

      <Logo v-if="module.type === 'official'" class="w-4 h-4" />
    </div>

    <p class="u-text-gray-500 text-sm line-clamp-2 sm:min-h-[40px] mb-4">
      {{ module.description }}
    </p>

    <div class="flex items-center justify-between gap-3 -mb-2 u-text-gray-500">
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-1.5">
          <UIcon name="heroicons-outline:star" class="w-4 h-4" />

          <span class="text-sm">{{ formatNumber(module.stars) }}</span>
        </div>
        <div class="flex items-center gap-1.5">
          <UIcon name="heroicons-outline:download" class="w-4 h-4" />

          <span class="text-sm">{{ formatNumber(module.downloads) }}</span>
        </div>
      </div>

      <div class="flex items-center gap-1.5">
        <UIcon name="heroicons-outline:users" class="w-4 h-4" />

        <span class="text-sm">{{ module.contributors.length }}</span>
      </div>
    </div>

    <NuxtLink :to="`/modules/${module.name}`" class="focus:outline-none" tabindex="-1">
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
