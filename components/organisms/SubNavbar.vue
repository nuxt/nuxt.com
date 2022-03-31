<template>
  <div
    class="z-[5] sticky top-0 hidden lg:block"
    :class="{ 'border-t u-border-gray-200': y <= 80, 'backdrop-blur-md shadow shadow-gray-200 dark:shadow-gray-900 border-transparent': y > 80 }"
  >
    <div class="absolute top-0 w-full h-16 bg-white bg-opacity-75 dark:bg-black" />
    <UContainer padded>
      <div class="relative grid items-center justify-between h-16 grid-cols-2 gap-3 sm:grid-cols-6">
        <div class="flex items-center justify-start gap-3">
          <slot name="left">
            <p v-if="title" class="font-semibold">
              {{ title }}
            </p>
          </slot>
        </div>

        <div v-if="links.length" class="flex justify-center col-span-4 gap-x-8">
          <ULink
            v-for="(link, index) in links"
            :key="index"
            :to="link.slug"
            class="text-sm"
            active-class="u-text-gray-900 font-semibold"
            inactive-class="font-medium u-text-gray-500 hover:u-text-gray-900"
          >
            {{ link.title }}
          </ULink>
        </div>

        <div class="flex gap-3 justify-end">
          <slot name="right" />
        </div>
      </div>
    </UContainer>
  </div>
</template>

<script setup lang="ts">
import { useWindowScroll } from '@vueuse/core'

const { y } = useWindowScroll()

defineProps({
  title: {
    type: String,
    default: null
  },
  links: {
    type: Array,
    default: () => []
  }
})
</script>
