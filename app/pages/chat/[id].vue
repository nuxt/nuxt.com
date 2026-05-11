<script setup lang="ts">
definePageMeta({
  layout: false,
  middleware: [
    function () {
      const id = useRoute().params.id
      return navigateTo(`/dashboard/chat/${id}`, { redirectCode: 301 })
    }
  ]
})
</script>

<template>
  <div />
</template>
