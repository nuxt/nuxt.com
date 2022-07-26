<template>
  <UToggle
    v-model="isDark"
    name="theme"
    icon-on="heroicons-outline:moon"
    icon-off="heroicons-outline:sun"
  />
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
