<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <UNotifications />
  </div>
</template>

<script setup>
useMeta({
  bodyAttrs: {
    class: 'antialiased font-sans text-gray-700 dark:text-gray-200 bg-white dark:bg-black'
  }
})

const { data: navigation } = await useAsyncData('navigation', () => queryContent().findNavigation())

provide('navigation', navigation.value)
</script>

<style>
html.dark {
  @apply bg-black;
}
</style>
