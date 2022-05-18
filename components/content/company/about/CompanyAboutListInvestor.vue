<template>
  <li class="flex flex-col items-center justify-center lg:w-[160px]">
    <img :src="image" :alt="name">
    <span class="mt-4 text-xl font-semibold u-text-gray-700">{{ name }}</span>
    <span class="text-lg u-text-gray-700">{{ job }}</span>
  </li>
</template>

<script setup lang="ts">
defineProps({
  name: {
    type: String,
    default: ''
  },
  image: {
    type: String,
    default: ''
  },
  job: {
    type: String,
    default: ''
  }
})
</script>
