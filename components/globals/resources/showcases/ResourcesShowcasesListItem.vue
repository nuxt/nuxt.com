<template>
  <NuxtLink :to="showcase.url" target="_blank" class="block group rounded-xl overflow-hidden border u-border-gray-50">
    <div class="aspect-w-4 aspect-h-3">
      <img
        :src="`https://res.cloudinary.com/nuxt/image/upload/f_auto,q_auto/${showcase.screenshotUrl}`"
        :alt="showcase.hostname"
        width="800"
        height="600"
        loading="lazy"
        class="object-cover absolute inset-0"
      >
      <div class="absolute inset-0">
        <div class="absolute bottom-0 inset-x-0 h-[50%] hidden group-hover:block" :style="{ background: 'linear-gradient(#00000000, #00000055)' }" />
        <div class="absolute bottom-0 inset-x-0 u-bg-gray-50 group-hover:bg-transparent">
          <div class="flex justify-between items-center gap-1 py-2 px-4">
            <h2 class="font-bold truncate group-hover:u-text-white">
              {{ showcase.title }}
            </h2>
            <UIcon name="heroicons-outline:external-link" class="w-5 h-5 u-text-white hidden group-hover:inline flex-shrink-0" />
          </div>
          <p class="text-sm pb-2 px-4 truncate group-hover:hidden">
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
