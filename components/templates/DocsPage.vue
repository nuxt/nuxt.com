<template>
  <div class="relative flex-1">
    <div
      v-if="$slots.header"
      ref="header"
      class="z-[1] sticky top-0"
      :class="{ 'backdrop-blur-md shadow shadow-gray-200 dark:shadow-gray-900': y > 80 }"
    >
      <div class="absolute top-0 w-full h-16 bg-white bg-opacity-75 dark:bg-black" />
      <UContainer padded>
        <div
          class="relative grid items-center justify-between h-16 grid-cols-2 gap-3 sm:grid-cols-6"
        >
          <slot name="header" />
        </div>
      </UContainer>
    </div>

    <main class="relative py-8">
      <UContainer>
        <div class="lg:grid lg:grid-cols-12 lg:gap-10 lg:relative">
          <aside class="pb-8 lg:pb-0 lg:sticky lg:top-16 sm:px-6 lg:px-0 lg:pt-8 lg:-mt-8 lg:self-start lg:col-span-3">
            <slot name="left" />
          </aside>

          <div class="space-y-6 sm:px-6 lg:px-0 lg:col-span-7">
            <slot />
          </div>

          <div class="pb-8 lg:pb-0 lg:sticky lg:top-12 sm:px-6 lg:px-0 lg:pt-8 lg:-mt-8 lg:self-start lg:col-span-2">
            <slot name="right" />
          </div>
        </div>
      </UContainer>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useWindowScroll } from '@vueuse/core'

const { y } = useWindowScroll()
</script>
