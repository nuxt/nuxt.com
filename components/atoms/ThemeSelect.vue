<template>
  <USelect
    v-model="colorMode.preference"
    name="theme"
    :options="options"
  />
</template>

<script setup>
const colorMode = useColorMode()
const options = [
  {
    text: 'System',
    value: 'system',
    icon: 'heroicons-outline:desktop-computer'
  },
  {
    text: 'Dark',
    value: 'dark',
    icon: 'heroicons-outline:moon'
  },
  {
    text: 'Light',
    value: 'light',
    icon: 'heroicons-outline:sun'
  }
]
</script>
