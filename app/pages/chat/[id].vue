<script setup lang="ts">
definePageMeta({
  layout: false,
  middleware: [
    function () {
      const id = useRoute().params.id
      const chatId = Array.isArray(id) ? id[0] : id
      if (!chatId) return navigateTo('/dashboard/chat', { redirectCode: 301 })
      return navigateTo(`/dashboard/chat/${chatId}`, { redirectCode: 301 })
    }
  ]
})
</script>

<template>
  <div />
</template>
