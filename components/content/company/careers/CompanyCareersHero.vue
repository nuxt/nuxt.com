<template>
  <div class="relative flex flex-col md:flex-row justify-center items-center md:h-[425px]">
    <div class="relative flex items-center justify-end md:absolute md:right-0">
      <img src="/company/careers/map.png">
      <div class="h-[100px] absolute top-0 inset-x-0 bg-gradient-to-b from-white dark:from-black to-transparent" />
      <div class="h-[100px] absolute bottom-0 inset-x-0 bg-gradient-to-t from-white dark:from-black to-transparent" />
      <div class="w-[100px] absolute left-0 inset-y-0 bg-gradient-to-r from-white dark:from-black to-transparent" />
    </div>

    <UContainer padded class="relative w-full py-12">
      <div class="flex flex-col justify-center space-y-5">
        <h1 class="text-5xl font-semibold lg:max-w-xl u-text-gray-900">
          <Markdown use="title" unwrap="p" />
        </h1>
        <p class="text-lg font-medium lg:max-w-md u-text-gray-500">
          <Markdown use="description" unwrap="p" />
        </p>

        <div class="flex gap-6">
          <UButton
            v-for="(button, index) in buttons"
            :key="index"
            v-bind="button"
          />
        </div>
      </div>
    </UContainer>
  </div>
</template>

<script setup lang="ts">
defineProps({
  buttons: {
    type: Array,
    default: () => []
  }
})
</script>
