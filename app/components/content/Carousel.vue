<script setup lang="ts">
defineProps<{
  items: string[]
}>()
</script>

<template>
  <UCarousel v-slot="{ item, index }" :items="items" :ui="{ item: 'basis-full sm:basis-1/2' }" dots>
    <ProseImg :src="item" :alt="`Figma preview ${index + 1}`" class="w-full rounded-lg" />
  </UCarousel>
</template>
