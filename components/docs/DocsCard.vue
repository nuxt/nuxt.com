<template>
  <li class="relative flex justify-between border border-gray-200 dark:border-gray-800 rounded-lg p-4">
    <div>
      <h2 v-if="$slots.title" class="text-3xl font-semibold sm:text-5xl u-text-gray-900 mb-2 mt-2">
        <ContentSlot :use="$slots.title" unwrap="p" />
      </h2>
      <h2 v-if="$slots.extraTitle" class="font-semibold u-text-gray-900" :class="fontSizeClass">
        <ContentSlot :use="$slots.extraTitle" unwrap="p" />
      </h2>
      <p class="u-text-gray-500">
        <ContentSlot :use="$slots.description" unwrap="p" />
      </p>
    </div>
    <div v-if="image" class="flex flex-col h-full w-full gap-x-4 items-end justify-center">
      <img :src="`/assets/docs/getting-started/views/${image}-light.png`" width="72" height="92" class="dark:hidden absolute right-0 bottom-0 object-cover h-[52px] w-[42px] md:h-[92px] md:w-[72px] opacity-100" role="presentation">
      <img :src="`/assets/docs/getting-started/views/${image}-dark.png`" width="72" height="92" class="hidden dark:block absolute right-0 bottom-0 object-cover h-[52px] w-[42px] md:h-[92px] md:w-[72px] opacity-100" role="presentation">
    </div>
  </li>
</template>

<script setup lang="ts">

defineProps({
  image: {
    type: String,
    default: ''
  },
  fontSizeClass: {
    type: String,
    default: ''
  }
})
</script>
