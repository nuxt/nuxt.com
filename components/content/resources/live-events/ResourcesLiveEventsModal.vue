<template>
  <UModal v-model="isOpen" appear width-class="max-w-xl lg:max-w-4xl xl:max-w-7xl">
    <LiteYouTubeEmbed
      :id="page.videoId"
      :title="page.title"
    />

    <h1 class="pt-4 pb-4 text-4xl font-semibold">
      {{ page.title }}
    </h1>

    <p class="pt-4 pb-8 text-lg font-medium u-text-gray-500">
      {{ page.description }}
    </p>

    <Document :value="page" class="prose" />
  </UModal>
</template>

<script setup lang="ts">
import LiteYouTubeEmbed from 'vue-lite-youtube-embed'
import 'vue-lite-youtube-embed/dist/style.css'

defineProps({
  page: {
    type: Object,
    default: () => {}
  }
})

const isOpen = ref(true)
</script>
