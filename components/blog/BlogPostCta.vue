<template>
  <AppCard padded class="relative">
    <h5 class="text-2xl font-semibold u-text-black">
      <slot name="title" />
    </h5>
    <p class="w-3/4 pt-3 u-text-gray-700">
      <slot name="description" />
    </p>
    <AppButton :label="buttonText" class="px-8 mt-6" :to="to" />

    <img :src="imagePath" class="absolute w-1/5" :class="imageClass">
  </AppCard>
</template>

<script setup lang="ts">
defineProps({
  buttonText: {
    type: String,
    default: ''
  },
  to: {
    type: String,
    default: ''
  },
  imagePath: {
    type: String,
    default: ''
  },
  imageClass: {
    type: String,
    default: 'right-0 inset-y-0 object-cover h-full'
  }
})
</script>
