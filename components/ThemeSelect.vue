<template>
  <AppToggle
    v-model="isDark"
    name="theme"
    icon-on="uil:moon"
    icon-off="uil:sun"
    class="theme-select"
  >
    <span class="sr-only">Toggle theme</span>
  </AppToggle>
</template>

<script setup lang="ts">
import { useColorMode } from '#imports'

const colorMode = useColorMode()

const isDark = computed({
  get () {
    return colorMode.value === 'dark'
  },
  set () {
    colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
  }
})
</script>

<style lang="postcss">
.theme-select {
  @apply bg-gray-200 dark:bg-gray-800
}
</style>
