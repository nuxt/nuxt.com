<template>
  <UCard padded shadow-class="" class="relative transition duration-200 hover:ring-2 hover:u-ring-gray-900">
    <div class="flex items-center gap-1.5">
      <p class="text-lg font-semibold truncate">
        {{ repository.name }}
      </p>

      <img :src="`https://github.com/${repository.owner.login}.png`" class="inline-block w-4 h-4 rounded grayscale">
    </div>

    <p class="u-text-gray-500 text-sm line-clamp-2 min-h-[40px] mb-4">
      {{ repository.description }}
    </p>

    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3 -mb-2 u-text-gray-500">
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-1.5">
            <UIcon name="heroicons-outline:star" class="w-4 h-4" />

            <span class="text-sm">{{ formatNumber(repository.stargazerCount) }}</span>
          </div>
        </div>

        <div class="flex items-center gap-1.5">
          <UIcon name="uil:code-branch" class="w-4 h-4" />

          <span class="text-sm">{{ repository.forkCount }}</span>
        </div>
      </div>
    </div>

    <NuxtLink :to="repository.url" target="_blank" class="focus:outline-none" tabindex="-1">
      <span class="absolute inset-0" aria-hidden="true" />
    </NuxtLink>
  </UCard>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { CommunityRepository } from '~/types'
import { formatNumber } from '~/utils'

defineProps({
  repository: {
    type: Object as PropType<CommunityRepository>,
    default: () => null
  }
})
</script>
