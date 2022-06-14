<template>
  <UCard padded body-class="aspect-w-4 aspect-h-3" shadow-class="" class="relative transition duration-200 group hover:ring-2 hover:u-ring-gray-900">
    <img
      :src="`https://res.cloudinary.com/nuxt/image/upload/f_auto,q_auto/${showcase.screenshotUrl}`"
      :alt="showcase.hostname"
      width="800"
      height="600"
      loading="lazy"
      class="absolute inset-0 object-cover"
    >

    <div class="absolute inset-0">
      <div class="absolute inset-x-0 bottom-0 px-4 py-3 u-bg-gray-50">
        <h2 class="font-semibold truncate u-text-gray-900">
          {{ showcase.title }}
        </h2>
        <p class="text-sm truncate u-text-gray-500">
          {{ showcase.hostname }}
        </p>
      </div>
    </div>

    <NuxtLink :to="showcase.url" target="_blank" class="focus:outline-none" tabindex="-1">
      <span class="absolute inset-0" aria-hidden="true" />
    </NuxtLink>
  </UCard>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'

defineProps({
  showcase: {
    type: Object as PropType<any>,
    default: () => null
  }
})
</script>
