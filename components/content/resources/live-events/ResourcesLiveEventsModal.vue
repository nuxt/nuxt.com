<template>
  <UModal v-model="isOpen" appear class="max-w-xl lg:max-w-4xl xl:max-w-7xl">
    <LiteYouTubeEmbed
      :id="page.videoId"
      :title="page.title"
    />

    <h1 class="text-4xl font-semibold pt-4 pb-4">
      {{ page.title }}
    </h1>

    <p class="text-lg u-text-gray-500 font-medium pt-4 pb-8">
      {{ page.description }}
    </p>

    <Content :document="page" class="prose" />
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
