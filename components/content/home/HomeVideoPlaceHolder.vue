<template>
  <div class="relative cursor-pointer group" @click="isOpen = !isOpen">
    <HomeModal v-model="isOpen" :video-id="videoId" :title="title" />
    <img src="/assets/home/place-holder.png" class="w-full h-full rounded-xl lg:rounded-r-xl lg:rounded-l-none">
    <div class="absolute inset-0 flex items-center justify-center">
      <UIcon name="heroicons-solid:play" alt="play icon" class="w-20 h-20 group-hover:text-gray-300" />
    </div>
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
