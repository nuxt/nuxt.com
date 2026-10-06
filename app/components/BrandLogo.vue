<script setup lang="ts">
const props = defineProps<{
  src: string
  alt: string
  width?: number
  height?: number
}>()

const style = computed(() => ({
  'aspectRatio': props.width && props.height ? `${props.width} / ${props.height}` : undefined,
  '--logo-src': `url(${props.src})`
}))
</script>

<template>
  <span role="img" :aria-label="alt" class="block bg-current [mask:var(--logo-src)_center/contain_no-repeat]" :style="style" />
</template>
