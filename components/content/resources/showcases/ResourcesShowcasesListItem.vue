<template>
  <UCard padded body-class="aspect-w-4 aspect-h-3" shadow-class="" class="relative transition duration-200 group hover:ring-2 ucard">
    <div class="flex flex-col">
      <div class="flex-1 min-h-0">
        <img
          :src="`https://res.cloudinary.com/nuxt/image/upload/f_auto,q_auto/${showcase.screenshotUrl}`"
          :alt="showcase.hostname"
          loading="lazy"
          class="object-cover object-top w-full h-full"
        >
      </div>

      <div class="px-4 py-3 u-bg-gray-50">
        <h2 class="font-semibold truncate u-text-gray-900">
          {{ showcase.title || showcase.hostname }}
        </h2>
        <p class="text-sm truncate u-text-gray-500">
          {{ showcase.hostname }}
        </p>
      </div>
    </div>

    <NuxtLink :to="showcase.url" target="_blank" tabindex="-1">
      <span class="absolute inset-0" aria-hidden="true" />
    </NuxtLink>
  </UCard>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { ResourcesShowcasesListGroupItem } from '~/types'

defineProps({
  showcase: {
    type: Object as PropType<ResourcesShowcasesListGroupItem>,
    default: () => null
  }
})
</script>

<style scoped>
.ucard:hover {
  --tw-ring-color: var(--colors-green-400)
}
</style>
