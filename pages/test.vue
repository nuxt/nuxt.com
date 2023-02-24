<template>
  <div>
      <AppToggle
      v-model="isDark"
      name="theme"
      icon-on="uil:moon"
      icon-off="uil:sun"
    >
      <span class="sr-only">Toggle theme</span>
    </AppToggle>

  </div>
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

<style scoped lang="ts">
css({
  div: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '300px',
    gap: '2rem',
    flexDirection: 'column'
  }
})
</style>
