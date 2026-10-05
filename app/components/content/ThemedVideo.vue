<script setup lang="ts">
defineOptions({ inheritAttrs: false })

withDefaults(defineProps<{
  light: string
  dark: string
  lightPoster?: string
  darkPoster?: string
  aspectRatio?: string
}>(), {
  aspectRatio: '16 / 10'
})

const colorMode = useColorMode()
</script>

<template>
  <ClientOnly>
    <video
      :key="colorMode.value"
      v-bind="$attrs"
      :src="colorMode.value === 'dark' ? dark : light"
      :poster="colorMode.value === 'dark' ? darkPoster : lightPoster"
      :style="{ aspectRatio }"
      class="w-full"
      muted
      playsinline
    />
    <template #fallback>
      <div :class="$attrs.class" :style="[$attrs.style, { aspectRatio }]" class="w-full bg-elevated" />
    </template>
  </ClientOnly>
</template>
