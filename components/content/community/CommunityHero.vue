<template>
  <DocsHero class="mb-6" :image="image">
    <template #title>
      <ContentSlot :use="$slots.title" unwrap="p" />
    </template>
    <template #description>
      <ContentSlot :use="$slots.description" unwrap="p" />
    </template>
    <template #extra>
      <NewsletterForm :button-text="buttonText" />
    </template>
  </DocsHero>
</template>

<script setup lang="ts">
defineProps({
  image: {
    type: Object,
    default: () => {}
  },
  buttonText: {
    type: String,
    default: 'Subscribe'
  }
})
</script>
