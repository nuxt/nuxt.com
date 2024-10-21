<script lang="ts" setup>
const { logo } = defineProps({
  logo: {
    type: Object as PropType<{ src: string, height: number, width: number, color: string, alt: string }>,
    default: () => {}
  }
})
const color = logo.color
const circle = ref<HTMLDivElement>()
const { elementX, elementY } = useMouseInElement(circle)
</script>

<template>
  <div
    ref="circle"
    :style="{
      '--x': `${elementX}px`,
      '--y': `${elementY}px`
    }"
    class="relative group isolate ring-1 bg-white dark:bg-gray-900 ring-gray-200 dark:ring-gray-800 before:hidden before:lg:block before:absolute before:-inset-[2px] before:h-[calc(100%+4px)] before:w-[calc(100%+4px)] before:z-[-1] before:rounded-full lg:flex-1 flex flex-col shadow circle-gradient items-center justify-center rounded-full"
  >
    <div class="p-5 sm:p-6 flex-1 flex flex-col overflow-hidden rounded-full divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-gray-900 hover:bg-opacity-90 dark:hover:bg-opacity-90 transition-[background-opacity]">
      <img :src="logo.src" :width="logo.width" :height="logo.height" :alt="logo.alt">
    </div>
  </div>
</template>

<style scoped lang="postcss">
.circle-gradient::before {
  background: radial-gradient(
    70px circle at var(--x) var(--y),
    v-bind(color) 0%,
    transparent 100%
  );
  will-change: background;
}
</style>
