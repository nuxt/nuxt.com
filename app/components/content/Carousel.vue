<script setup lang="ts">
defineProps<{
  items: string[]
}>()
</script>

<template>
  <UCarousel v-slot="{ item, index }" :items="items" :ui="{ item: 'basis-1/3' }" dots>
    <ProseImg :src="item" :alt="`Image ${index + 1}`" width="320" class="rounded-lg" />
  </UCarousel>
</template>
