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
  bodyAttrs: {
    class: 'antialiased font-sans text-gray-700 bg-gray-50 dark:bg-gray-900 dark:text-gray-200 bg-white dark:bg-black'
  }
})
</script>

<style>
html.dark {
  @apply bg-black;
}
</style>
