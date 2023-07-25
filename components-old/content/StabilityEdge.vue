<template>
  <Alert>
    🧪 {{ title }} is available on edge channel. Check out the
    <NuxtLink to="/docs/guide/going-further/edge-channel">
      Edge Channel Documentation
    </NuxtLink> to beta test.
    <slot />
  </Alert>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: 'This feature'
  }
})
</script>
