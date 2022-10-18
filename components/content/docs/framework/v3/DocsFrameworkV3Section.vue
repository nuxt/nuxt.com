<template>
  <UContainer padded class="relative flex flex-col items-center sm:items-start gap-y-8">
    <div class="flex flex-col py-20 gap-y-8 last:pb-0" :class="{ 'items-center': center }">
      <h2 class="text-4xl font-semibold text-left u-text-gray-900">
        <ContentSlot :use="$slots.title" unwrap="p" />
      </h2>
      <p class="w-full text-lg text-left lg:w-1/2 u-text-gray-500" :class="center ? 'text-center' : 'text-left'">
        <ContentSlot :use="$slots.description" unwrap="p" />
      </p>
      <ContentSlot :use="$slots.content" unwrap="p" />
    </div>
  </UContainer>
</template>

<script setup lang="ts">
defineProps({
  center: {
    type: Boolean,
    default: false
  }
})
</script>
