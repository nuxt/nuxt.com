<template>
  <div class="text-center">
    <p class="text-base font-semibold text-primary-500 dark:text-primary-400">
      {{ error.statusCode || 404 }}
    </p>
    <h1 class="mt-4 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
      {{ error.name || error.statusMessage || 'Page not found' }}
    </h1>
    <p class="mt-6 text-base leading-7 text-gray-500 dark:text-gray-400">
      {{ error.message || 'This is not the page you\'re looking for.' }}
    </p>
    <div class="mt-10 flex items-center justify-center gap-x-6">
      <<a href="#" class="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Go back home</a>
      <a href="#" class="text-sm font-semibold text-gray-900 dark:text-white">Contact support <span aria-hidden="true">&rarr;</span></a>>
    </div>
  </div>

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
defineProps<{
  error: Object
}>()

const handleError = () => clearError({ redirect: '/' })
</script>
