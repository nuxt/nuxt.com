<template>
  <div>
    <NuxtLayout>
      <PageError :error="error" />
    </NuxtLayout>
    <UNotifications />
  </div>
</template>

<script setup>
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

<style>
html.dark {
  @apply bg-black;
}
</style>
