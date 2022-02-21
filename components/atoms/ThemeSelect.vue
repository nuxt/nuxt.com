<template>
  <USelect
    v-model="value"
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

const value = computed({
  get () {
    return colorMode.preference || 'system'
  },
  set (value) {
    switch (value) {
      case 'dark':
        colorMode.preference = 'dark'
        break
      case 'light':
        colorMode.preference = 'light'
        break
      default:
        colorMode.preference = 'system'
    }
  }
})
</script>
