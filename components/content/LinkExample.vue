<template>
  <Alert type="info" icon="🔎">
    <Icon class="inline-block w-5 h-5 mr-1" name="file-icons:sandbox" />
    Read and edit a live example in
    <NuxtLink :to="link">
      {{ computedTitle }}
    </NuxtLink>.
  </Alert>
</template>

<script setup lang="ts">
const props = defineProps({
  link: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  }
})

const computedTitle = computed(() => createTitle(props.title, props.link))
</script>
