<template>
  <LiteYouTubeEmbed
    :id="videoId"
    :title="title"
  />
</template>

<script setup lang="ts">
import LiteYouTubeEmbed from 'vue-lite-youtube-embed'
import 'vue-lite-youtube-embed/style.css'

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
</script>
