<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
      <UNotifications />
    </NuxtLayout>
  </div>
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

<style>
html.dark {
  @apply bg-black;
}
</style>
