<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  cloudinary: string
}>()

const controls = ref(false)
</script>

<template>
  <video
    type="video/mp4"
    :poster="`https://res.cloudinary.com/nuxt/video/upload/${cloudinary}.jpg`"
    loop
    muted
    autoplay
    preload="auto"
    class="w-[190] m-auto shadow-2xl"
    :controls="controls"
    :style="{
      'border-radius': '1% / 1.5%',
    }"
    @click="controls = !controls"
  >
    <source :src="`https://res.cloudinary.com/nuxt/video/upload/${cloudinary}.webm`" type="video/webm">
    <source :src="`https://res.cloudinary.com/nuxt/video/upload/${cloudinary}.mp4`" type="video/mp4">
    <source :src="`https://res.cloudinary.com/nuxt/video/upload/${cloudinary}.ogg`" type="video/ogg">
  </video>
</template>
