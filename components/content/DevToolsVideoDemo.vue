<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  src: string
}>()

const controls = ref(false)
</script>

<template>
  <video
    type="video/mp4"
    :src="src"
    loop muted autoplay
    :controls="controls"
    class="w-[190] m-auto shadow-2xl"
    :style="{
      'border-radius': '1% / 1.5%',
    }"
    @click="controls = !controls"
  />
</template>
