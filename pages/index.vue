<script setup>
definePageMeta({
  layout: false
})

useMeta({
  htmlAttrs: {
    class: 'bg-black dark'
  },
  bodyAttrs: {
    class: 'antialiased font-sans text-gray-700 dark:text-gray-200'
  }
})
</script>

<template>
  <div class="min-h-screen h-full flex flex-col justify-center py-12">
    <div class="px-4 sm:px-6 lg:px-8 w-6xl mx-auto">
      <Logo class="w-20 h-20 logo mb-6" />
      <h1 class="text-4xl sm:text-6xl font-extrabold u-text-gray-900 mb-6">
        A better way to create<br>modern websites.
      </h1>
      <p class="text-lg sm:text-2xl u-text-gray-500">
        Our suite of developer-friendly solutions helps you create,<br>secure and deliver enterprise-grade modern website.
      </p>
      <div class="flex items-center gap-6 mt-12">
        <UButton to="https://nuxtlabs.com" label="Company" size="xl" />
        <UButton to="https://nuxtjs.org" label="Framework" size="xl" />
      </div>
      <!-- Work in progress... 👀 -->
    </div>
  </div>
</template>

<style scoped>
.logo {
  color: #00DC82;
}
</style>
