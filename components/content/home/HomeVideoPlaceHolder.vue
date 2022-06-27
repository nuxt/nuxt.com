<template>
  <div class="cursor-pointer" @click="isOpen = !isOpen">
    <HomeModal v-model="isOpen" :video-id="videoId" :title="title" />
    <img src="/assets/home/place-holder.png" class="w-full h-full rounded-xl lg:rounded-r-xl lg:rounded-l-none">
  </div>
</template>

<script setup lang="ts">
defineProps({
  videoId: {
    type: String,
    default: ''
  },
  title: {
    type: String,
    default: ''
  }
})

const isOpen = ref(false)
</script>
