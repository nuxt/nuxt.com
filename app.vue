<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup>
useMeta({
  htmlAttrs: {
    class: 'bg-white'
  },
  bodyAttrs: {
    class: 'antialiased text-gray-700 bg-gray-100 dark:bg-gray-900 dark:text-gray-200'
  }
})
</script>
