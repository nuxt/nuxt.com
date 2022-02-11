<template>
  <NuxtLayout>
    <NuxtPage />
    <UNotifications />
  </NuxtLayout>
</template>

<script setup>
useMeta({
  htmlAttrs: {
    class: 'bg-white dark:bg-black'
  },
  bodyAttrs: {
    class: 'antialiased font-sans text-gray-700 bg-gray-50 dark:bg-gray-900 dark:text-gray-200'
  }
})
</script>
