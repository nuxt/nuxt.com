
<template>
  <UCard class="relative" :class="dark ? 'u-bg-gray-900 u-text-white' : 'u-bg-white u-text-grey-900'">
    <h5 class="text-2xl font-bold">
      <slot name="title" />
    </h5>
    <p class="w-3/4 pt-3" :class="{ 'u-text-gray-700': !dark }">
      <slot name="description" />
    </p>
    <UButton v-if="dark" variant="transparent" class="u-border-white px-8 mt-6 hover:u-border-gray-200" :to="to">
      <span class="u-text-white hover:u-text-gray-200">
        {{ buttonText }}
      </span>
    </UButton>
    <UButton v-else :label="buttonText" class="px-8 mt-6" :to="to" />
    <img :src="imagePath" class="absolute w-1/5" :class="imageClass">
  </UCard>
</template>

<script setup>
defineProps({
  buttonText: {
    type: String,
    default: ''
  },
  to: {
    type: String,
    default: ''
  },
  dark: {
    type: Boolean,
    default: false
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
