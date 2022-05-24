<template>
  <div class="flex flex-col py-20 gap-y-8 not-prose" :class="{ 'items-center': center }">
    <h1 class="text-4xl font-semibold text-left u-text-gray-900">
      <Markdown :use="$slots.title" unwrap="p" />
    </h1>
    <p class="w-full text-lg text-left lg:w-1/2 u-text-gray-500" :class="center ? 'text-center' : 'text-left'">
      <Markdown :use="$slots.description" unwrap="p" />
    </p>
    <Markdown :use="$slots.content" unwrap="p" />
  </div>
</template>

<script setup lang="ts">
defineProps({
  center: {
    type: Boolean,
    default: false
  }
})
</script>
