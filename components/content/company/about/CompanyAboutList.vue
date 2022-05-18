<template>
  <UContainer padded class="relative flex flex-wrap gap-24 py-24">
    <div class="self-start flex-1 lg:sticky lg:top-0 lg:pt-32 lg:-mt-32">
      <h2 class="max-w-sm text-4xl font-semibold u-text-gray-900">
        <Markdown use="title" unwrap="p" />
      </h2>
    </div>

    <ul class="grid w-full lg:w-auto" :class="listClass">
      <Markdown use="list" unwrap="p" />
    </ul>
  </UContainer>
</template>

<script setup lang="ts">
defineProps({
  listClass: {
    type: String,
    default: 'grid-cols-2 gap-12 lg:gap-24'
  }
})
</script>
