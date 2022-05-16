<template>
  <div v-if="item" class="flex flex-col items-center justify-center lg:w-[160px]">
    <img :src="item.image" :alt="item.name">
    <span class="mt-4 text-xl font-semibold u-text-gray-700">{{ item.name }}</span>
    <span class="text-lg u-text-gray-700">{{ item.job }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps({
  item: {
    type: Object,
    default: () => null
  }
})
</script>
