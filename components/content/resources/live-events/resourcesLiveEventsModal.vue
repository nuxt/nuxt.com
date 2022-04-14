<template>
  <UModal v-model="isOpen" appear width-class="max-w-xl lg:max-w-4xl xl:max-w-7xl" @close="close">
    <LiteYouTubeEmbed
      :id="modalData.videoId"
      :title="modalData.title"
    />

    <h1 class="text-4xl font-semibold pt-4 pb-8">
      {{ modalData.title }}
    </h1>

    <Content :document="modalData" class="prose" />
  </UModal>
</template>

<script setup lang="ts">
import LiteYouTubeEmbed from 'vue-lite-youtube-embed'
import 'vue-lite-youtube-embed/dist/style.css'

defineComponent({
  LiteYouTubeEmbed
})

const props = defineProps({
  slug: {
    type: String,
    default: ''
  }
})

const { data: modalData } = await useAsyncData(`live-events-modal-${props.slug}`, () => queryContent(`/resources/live-events/collections/${props.slug}`).findOne())

const emit = defineEmits(['close'])

const isOpen = ref(true)

function close () {
  isOpen.value = false
  onClose()
}

function onClose () {
  setTimeout(() => {
    emit('close')
  }, 300)
}
</script>
