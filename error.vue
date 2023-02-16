<template>
  <div>
    <NuxtLayout>
      <PageError :error="error" />
    </NuxtLayout>
    <AppNotifications />
  </div>
</template>

<script setup lang="ts">
useHead({
  bodyAttrs: {
    class: 'antialiased font-sans text-gray-700 dark:text-gray-200 bg-white dark:bg-black'
  }
})

defineProps({
  error: {
    type: Object,
    required: true
  }
})
</script>
