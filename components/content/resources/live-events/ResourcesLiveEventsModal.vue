<template>
  <UModal v-model="isOpen" appear body-class="p-8" width-class="max-w-xl lg:max-w-4xl xl:max-w-7xl">
    <div class="overflow-hidden rounded-xl">
      <YoutubePlayer :video-id="page.videoId" :title="page.title" />
    </div>

    <h1 class="pt-8 pb-3 text-3xl font-semibold u-text-gray-900">
      {{ page.title }}
    </h1>

    <p class="pb-8 text-lg font-medium u-text-gray-500">
      {{ page.description }}
    </p>

    <div class="prose dark:prose-invert max-w-none">
      <ContentRenderer :value="page" />
    </div>
  </UModal>
</template>

<script setup lang="ts">
import { PropType } from 'vue'
import { ResourcesLiveEvent } from '~/types'

defineProps({
  page: {
    type: Object as PropType<ResourcesLiveEvent>,
    default: () => {}
  }
})

const isOpen = ref(true)
</script>
