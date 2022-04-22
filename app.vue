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
const { fetch: fetchModules } = useModules()

await Promise.all([fetchNavigation(), fetchModules()])
</script>

<style>
html.dark {
  @apply bg-black;
}
</style>
