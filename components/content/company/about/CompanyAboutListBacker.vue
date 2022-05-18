<template>
  <li class="flex items-center justify-center lg:w-[160px]">
    <img :src="image" :alt="name">
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
  }
})
</script>
