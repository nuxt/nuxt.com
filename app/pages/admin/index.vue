<script setup lang="ts">
definePageMeta({
  layout: false,
  middleware: [
    function () {
      return navigateTo('/admin/analytics', { redirectCode: 301 })
    }
  ]
})
</script>

<template>
  <div />
</template>
