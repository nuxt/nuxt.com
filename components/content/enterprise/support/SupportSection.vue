<template>
  <div class="container pt-8 pb-[120px] flex flex-col gap-y-8">
    <h2 class="u-text-gray-900 text-4xl font-semibold">
      <ContentSlot :use="$slots.title" unwrap="p" />
    </h2>

    <p class="u-text-gray-800 text-lg">
      <ContentSlot :use="$slots.description" unwrap="p" />
    </p>

    <div v-if="$slots.extra">
      <ContentSlot :use="$slots.extra" unwrap="p" />
    </div>

    <ul v-if="$slots.list" class="gap-y-6 flex flex-col">
      <ContentSlot :use="$slots.list" unwrap="p" />
    </ul>

    <div>
      <AppButton v-if="button" v-bind="button" />
    </div>

    <NuxtLink v-if="to" :to="to" class="u-text-gray-900 flex gap-x-4 items-center relative group w-fit font-semibold">
      <ContentSlot :use="$slots.link" unwrap="p" />
      <Icon name="heroicons-solid:arrow-right" class="w-4 h-4 mt-1" />
      <span class="absolute w-0 -bottom-1 h-[1px] u-bg-gray-900 group-hover:w-full transition-all duration-200" />
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { Image, Button } from 'types'

defineProps({
  image: {
    type: Object as PropType<Image>,
    default: () => {}
  },
  to: {
    type: String,
    default: ''
  },
  button: {
    type: Object as PropType<Button>,
    default: null
  }
})
</script>
