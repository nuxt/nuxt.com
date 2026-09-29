<script setup lang="ts">
const props = defineProps<{
  src: string
  alt: string
  width?: number
  height?: number
}>()

const style = computed(() => ({
  aspectRatio: props.width && props.height ? `${props.width} / ${props.height}` : undefined,
  mask: `url(${props.src}) center / contain no-repeat`
}))
</script>

<template>
  <span role="img" :aria-label="alt" class="block bg-current" :style="style" />
</template>
