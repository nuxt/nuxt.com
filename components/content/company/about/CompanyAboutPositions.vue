<template>
  <UContainer padded class="pt-24 pb-36">
    <div class="grid grid-cols-1 gap-8 md:grid-cols-6 lg:grid-cols-6">
      <div class="flex flex-col gap-5 md:col-span-3 lg:col-span-2">
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

      <div class="flex items-center md:col-span-3 lg:col-span-4">
        <img src="/company/about/map.svg">
      </div>
    </div>
  </UContainer>
</template>

<script setup lang="ts">
defineProps({
  button: {
    type: Object,
    default: () => null
  }
})
</script>
