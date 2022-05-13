<template>
  <NuxtLink :to="showcase.url" target="_blank" class="block overflow-hidden border group rounded-xl u-border-gray-50">
    <div class="aspect-w-4 aspect-h-3">
      <img
        :src="`https://res.cloudinary.com/nuxt/image/upload/f_auto,q_auto/${showcase.screenshotUrl}`"
        :alt="showcase.hostname"
        width="800"
        height="600"
        loading="lazy"
        class="absolute inset-0 object-cover"
      >
      <div class="absolute inset-0">
        <div class="absolute bottom-0 inset-x-0 h-[50%] hidden group-hover:block" :style="{ background: 'linear-gradient(#00000000, #00000055)' }" />
        <div class="absolute inset-x-0 bottom-0 px-4 py-3 u-bg-gray-50 group-hover:bg-transparent">
          <div class="flex items-center justify-between gap-1">
            <h2 class="font-semibold truncate u-text-gray-900 group-hover:u-text-white">
              {{ showcase.title }}
            </h2>
            <UIcon name="heroicons-outline:external-link" class="flex-shrink-0 hidden w-5 h-5 u-text-white group-hover:inline" />
          </div>
          <p class="text-sm truncate group-hover:hidden u-text-gray-500">
            {{ showcase.hostname }}
          </p>
        </div>
      </div>
    </div>
  </NuxtLink>
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
