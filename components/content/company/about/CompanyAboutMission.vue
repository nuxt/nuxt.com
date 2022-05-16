<template>
  <UContainer padded class="py-24">
    <div class="grid grid-cols-1 gap-8 md:grid-cols-6 lg:grid-cols-6">
      <div class="flex flex-col gap-5 md:col-span-3 lg:col-span-2">
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

      <div class="flex items-center md:col-span-3 lg:col-span-4">
        <img v-if="image" :src="image">
      </div>
    </div>
  </UContainer>
</template>

<script setup lang="ts">
defineProps({
  image: {
    type: String,
    default: ''
  }
})
</script>
