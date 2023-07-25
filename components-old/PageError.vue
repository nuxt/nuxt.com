<template>
  <div class="flex-1 px-4 py-16 bg-white dark:bg-black sm:px-6 sm:py-24 md:grid md:place-items-center lg:px-8">
    <div class="mx-auto max-w-max">
      <section class="sm:flex">
        <p class="text-4xl font-semibold text-primary-500 sm:text-5xl">
          {{ error.statusCode || 404 }}
        </p>
        <div class="sm:ml-6">
          <div class="sm:border-l sm:u-border-gray-200 sm:pl-6">
            <h1 class="text-4xl font-semibold tracking-tight u-text-gray-900 sm:text-5xl">
              {{ error.name || error.statusMessage || 'Page not found' }}
            </h1>
            <p class="mt-1 text-xl u-text-gray-500">
              {{ error.message || 'This is not the page you\'re looking for.' }}
            </p>
          </div>
          <div class="flex gap-3 mt-10 sm:border-l sm:border-transparent sm:pl-6">
            <AppButton label="Go back home" variant="primary" @click="handleError" />
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  error: {
    type: Object,
    default: () => ({})
  }
})

const handleError = () => clearError({ redirect: '/' })
</script>
