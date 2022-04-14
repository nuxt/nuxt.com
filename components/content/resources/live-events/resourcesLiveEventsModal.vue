<template>
  <UModal v-model="isOpen" appear width-class="max-w-7xl" @close="onClose">
    <div>
      <LiteYouTubeEmbed
        id="vbsPXHCu8Xg"
        title="test"
      />
    </div>
    <h1 class="text-4xl font-semibold pt-4">
      {{ videoTitle }}
    </h1>
  </UModal>
</template>

<script setup lang="ts">
import LiteYouTubeEmbed from 'vue-lite-youtube-embed'
import 'vue-lite-youtube-embed/dist/style.css'

defineComponent({
  LiteYouTubeEmbed
})

defineProps({
  videoSrc: {
    type: String,
    default: ''
  },
  videoTitle: {
    type: String,
    default: ''
  }
})

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
