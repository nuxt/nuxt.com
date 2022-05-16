<template>
  <div v-if="item" class="flex items-center justify-center lg:w-[160px]">
    <img :src="item.image" :alt="item.name">
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
