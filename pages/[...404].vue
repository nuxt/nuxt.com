<template>
  <div class="bg-white dark:bg-black flex-1 px-4 py-16 sm:px-6 sm:py-24 md:grid md:place-items-center lg:px-8">
    <div class="max-w-max mx-auto">
      <main class="sm:flex">
        <p class="text-4xl font-extrabold text-primary-500 sm:text-5xl">
          {{ error.statusCode }}
        </p>
        <div class="sm:ml-6">
          <div class="sm:border-l sm:u-border-gray-200 sm:pl-6">
            <h1 class="text-4xl font-extrabold u-text-gray-900 tracking-tight sm:text-5xl">
              {{ error.name || 'Not Found' }}
            </h1>
            <p class="mt-1 text-xl u-text-gray-500">
              {{ error.message }}
            </p>
          </div>
          <div class="mt-10 flex gap-3 sm:border-l sm:border-transparent sm:pl-6">
            <UButton :to="{ name: '@team-projects', params: { team: user.username } }" label="Go back home" variant="primary" />
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Ref } from 'vue'
import type { User } from '~/types'

const user = useStrapiUser() as Ref<User>

const error = {
  name: 'Page not found',
  message: 'This is not the page you\'re looking for.',
  statusCode: 404
}
</script>
