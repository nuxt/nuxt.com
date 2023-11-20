<script setup lang="ts">
defineProps<{
  cloudinary: string
}>()
</script>

<template>
  <video
    type="video/mp4"
    :poster="`https://res.cloudinary.com/nuxt/video/upload/${cloudinary}.jpg`"
    controls
    muted
    preload="auto"
    class="w-[190] m-auto shadow-2xl"
    :style="{
      'border-radius': '1% / 1.5%',
    }"
  >
    <source :src="`https://res.cloudinary.com/nuxt/video/upload/${cloudinary}.webm`" type="video/webm">
    <source :src="`https://res.cloudinary.com/nuxt/video/upload/${cloudinary}.mp4`" type="video/mp4">
    <source :src="`https://res.cloudinary.com/nuxt/video/upload/${cloudinary}.ogg`" type="video/ogg">
  </video>
</template>
