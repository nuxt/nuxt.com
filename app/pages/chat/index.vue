<script setup lang="ts">
definePageMeta({
  layout: false,
  middleware: [
    function () {
      return navigateTo('/dashboard/chat', { redirectCode: 301 })
    }
  ]
})
</script>

<template>
  <div />
</template>
