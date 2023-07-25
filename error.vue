<template>
  <div>
    <AppHeader />

    <UContainer>
      <UPageError :error="error" />
    </UContainer>

    <AppFooter />

    <ClientOnly>
      <UNotifications />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
useSeoMeta({
  title: 'Page not found',
  description: 'We are sorry but this page could not be found.'
})

defineProps({
  error: {
    type: Object,
    required: true
  }
})
</script>
