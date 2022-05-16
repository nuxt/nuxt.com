<template>
  <div class="flex flex-col-reverse items-start pt-12 md:block md:relative pb-36">
    <div class="md:absolute md:right-0 md:top-12">
      <div class="relative">
        <img src="/company/about/map.svg">
        <div class="h-[100px] absolute top-0 inset-x-0 bg-gradient-to-b from-white dark:from-black to-transparent" />
        <div class="w-[100px] absolute left-0 inset-y-0 bg-gradient-to-r from-white dark:from-black to-transparent" />
        <div class="h-[100px] absolute bottom-0 inset-x-0 bg-gradient-to-t from-white dark:from-black to-transparent" />
      </div>
    </div>

    <UContainer padded class="relative pb-12 mx-0 md:mx-auto md:pt-24 md:pb-36">
      <div class="flex flex-col max-w-sm gap-5">
        <h2 class="text-4xl font-semibold u-text-gray-900">
          <Markdown use="title" unwrap="p" />
        </h2>
        <p class="text-lg u-text-gray-700">
          <Markdown use="description" unwrap="p" />
        </p>
        <div>
          <UButton v-if="button" v-bind="button" />
        </div>
      </div>
    </UContainer>
  </div>
</template>

<script setup lang="ts">
defineProps({
  button: {
    type: Object,
    default: () => null
  }
})
</script>
