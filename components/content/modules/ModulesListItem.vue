<template>
  <UCard padded shadow-class="" class="relative transition duration-200 hover:ring-2 hover:u-ring-gray-900">
    <div class="mt-2 mb-6">
      <img
        v-if="!coverError && module.icon"
        :src="module.icon.match(/^http(s)?:\/\//) ? module.icon : 'https://api.nuxtjs.org/api/ipx/s_80,f_webp/gh/nuxt/modules/main/website/public/icons/' + module.icon"
        :alt="module.title"
        class="w-auto h-12"
        @error="coverError = true"
      >
      <div v-else class="flex items-center w-12 h-12 p-2 rounded-lg u-bg-gray-100">
        <UIcon name="heroicons-outline:photograph" class="w-8 h-8 u-text-gray-400" />
      </div>
    </div>

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

    <NuxtLink :to="module.website" target="_blank" class="focus:outline-none" tabindex="-1">
      <span class="absolute inset-0" aria-hidden="true" />
    </NuxtLink>
  </UCard>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { formatNumber } from '~/utils'

defineProps({
  module: {
    type: Object as PropType<any>,
    default: () => null
  }
})

const coverError = ref(false)
</script>
