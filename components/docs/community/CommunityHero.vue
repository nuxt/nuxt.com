<template>
  <div class="flex justify-between gap-y-4">
    <div class="flex flex-col gap-6">
      <h1 class="text-4xl font-semibold sm:text-5xl u-text-gray-900">
        <ContentSlot :use="$slots.title" unwrap="p" />
      </h1>
      <p class="font-medium sm:text-lg u-text-gray-500">
        <ContentSlot :use="$slots.description" unwrap="p" class="lg:w-2/3" />
      </p>
    </div>
    <div v-if="imagePath" class="flex h-full w-full gap-x-4 items-end justify-center hidden md:block">
      <img
        :src="`${imagePath}-light.png`"
        alt=""
        width="143"
        height="136"
        class="dark:hidden object-cover h-[136px] w-[143px] opacity-0 md:opacity-100"
        role="presentation"
      >
      <img
        :src="`${imagePath}-dark.png`"
        alt=""
        width="143"
        height="136"
        class="hidden dark:block object-cover h-[136px] w-[143px] opacity-0 md:opacity-100"
        role="presentation"
      >
    </div>
  </div>
</template>
<script setup lang="ts">
defineProps({
  imagePath: {
    type: String,
    default: ''
  }
})
</script>
