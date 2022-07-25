<template>
  <UModal v-model="isOpen" appear body-class="p-8" width-class="relative max-w-xl lg:max-w-4xl xl:max-w-7xl">
    <UButton icon="uil:multiply" variant="transparent" class="!p-0 u-text-gray-900 top-2 right-2 absolute" @click="isOpen = false" />

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
import type { PropType, WritableComputedRef } from 'vue'
import type { ResourcesLiveEvent } from '~/types'

const props = defineProps({
  page: {
    type: Object as PropType<ResourcesLiveEvent>,
    default: () => {}
  },
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const isOpen: WritableComputedRef<boolean> = computed({
  get () {
    return props.modelValue
  },
  set (value) {
    emit('update:modelValue', value)
  }
})

</script>
