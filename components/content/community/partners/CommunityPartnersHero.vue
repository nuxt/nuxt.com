<template>
  <UContainer padded class="py-12">
    <div class="flex flex-col-reverse grid-cols-1 gap-8 md:grid sm:grid-cols-2 lg:grid-cols-3">
      <div class="flex flex-col justify-center py-8 space-y-5 lg:col-span-2">
        <h1 class="text-5xl font-semibold u-text-gray-900">
          <Markdown use="title" unwrap="p" />
        </h1>
        <p class="max-w-xl text-lg font-medium u-text-gray-500">
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

      <div class="relative flex items-center justify-center lg:col-span-1">
        <img src="/gems.svg" class="h-[280px]">
      </div>
    </div>
  </UContainer>
</template>

<script setup lang="ts">
defineProps({
  buttons: {
    type: Array,
    default: () => []
  }
})
</script>
