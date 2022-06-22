<template>
  <UModal v-model="isOpen" appear body-class="p-8" width-class="max-w-xl lg:max-w-4xl xl:max-w-7xl">
    <div class="overflow-hidden rounded-xl">
      <YoutubePlayer :video-id="videoId" :title="title" />
    </div>
  </UModal>
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

const isOpen = ref(true)
</script>
