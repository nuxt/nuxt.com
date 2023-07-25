<script setup lang="ts">
const preferNoBanner = () => {
  localStorage.setItem('preferNoCoursesBanner', 'true')
  document.querySelector('html')?.classList.add('hide-banner')
}

if (process.server) {
  useHead({
    script: [
      {
        key: 'prehydrate-workshop-banner',
        innerHTML: `
            if (localStorage.getItem('preferNoCoursesBanner') === 'true') {
              document.querySelector('html').classList.add('hide-banner')
            }`.replace(/\s+/g, ' '),
        type: 'text/javascript'
      }
    ]
  })
}
</script>

<template>
  <div class="relative w-full bg-white dark:bg-black z-50 border-b border-b-gray-300 dark:border-b-gray-700 workshop-banner">
    <div class="flex flex-wrap justify-center items-center gap-1.5 p-2 w-4/5 mx-auto">
      <NuxtLink to="/enterprise/courses" class="text-sm text-center items-center text-black dark:text-white justify-center">
        ✨ Discover our official
        <span class="font-semibold">
          Nuxt Training Courses.
        </span>
      </NuxtLink>
      <NuxtLink to="/enterprise/courses" class="inline-flex items-center px-2 py-1 font-medium text-xs border rounded border-gray-400 hover:border-gray-600 dark:border-gray-700 dark:hover:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-900">
        <span>Learn more</span>
      </NuxtLink>
    </div>
    <div class="absolute top-2 right-1">
      <AppButton class="font-semibold" variant="link" size="xs" icon="carbon:close" @click="preferNoBanner" />
    </div>
  </div>
</template>

<style>
.hide-banner .workshop-banner{
  display: none;
}
</style>
