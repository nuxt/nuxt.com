<template>
  <div class="flex flex-col-reverse items-start pt-24 pb-24 xl:pb-36 xl:block xl:relative">
    <div class="self-end translate-x-8 xl:translate-x-0 xl:absolute xl:-right-8 xl:top-24">
      <img v-if="image" :src="image" class="relative">
    </div>

    <UContainer padded class="relative pb-24 mx-0 xl:mx-auto">
      <div class="flex flex-col max-w-md gap-5">
        <h2 class="text-xl font-semibold uppercase u-text-gray-300">
          <Markdown use="title" unwrap="p" />
        </h2>
        <h3 class="text-4xl font-semibold u-text-gray-900">
          <Markdown use="subtitle" unwrap="p" />
        </h3>
        <p class="text-2xl font-semibold u-text-gray-700">
          <Markdown use="description" unwrap="p" />
        </p>
      </div>
    </UContainer>
  </div>
</template>

<script setup lang="ts">
defineProps({
  image: {
    type: String,
    default: ''
  }
})
</script>
