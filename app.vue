<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
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

const { fetchNavigation } = useContent()

await fetchNavigation()

const { data: modules } = await useFetch('https://modules.nuxtjs.org/api/modules', {
  transform: data => data.modules
})

provide('modules', modules)
</script>

<style>
html.dark {
  @apply bg-black;
}
</style>
