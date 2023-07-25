<script setup lang="ts">
const preferNoBanner = () => {
  localStorage.setItem('preferNoTemplateBanner', 'true')
  document.querySelector('html')?.classList.add('hide-banner')
}

if (process.server) {
  useHead({
    script: [
      {
        key: 'prehydrate-template-banner',
        innerHTML: `
            if (localStorage.getItem('preferNoTemplateBanner') === 'true') {
              document.querySelector('html').classList.add('hide-banner')
            }`.replace(/\s+/g, ' '),
        type: 'text/javascript'
      }
    ]
  })
}
</script>

<template>
  <div class="relative w-full bg-white dark:bg-black z-50 border-b border-b-gray-300 dark:border-b-gray-700 template-banner">
    <div class="flex flex-wrap justify-center items-center gap-2 p-2 w-4/5 mx-auto">
      <NuxtLink to="https://1.envato.market/nuxt-tairo" target="_blank" class="text-sm text-center items-center text-black dark:text-white justify-center">
        <span class="font-semibold">
          ✨ Meet Tairo
        </span>
        - The admin dashboard template powered by Nuxt + Tailwind CSS
      </NuxtLink>
      <NuxtLink to="https://1.envato.market/nuxt-tairo-preview" target="_blank" class="inline-flex items-center px-2 py-1 font-medium text-xs border rounded border-gray-400 hover:border-gray-600 dark:border-gray-700 dark:hover:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-900">
        <span>Preview</span>
        <Icon name="material-symbols:arrow-outward-rounded" class="inline-block w-4 h-4" />
      </NuxtLink>
      <NuxtLink to="https://1.envato.market/nuxt-tairo" target="_blank" class="inline-flex items-center px-2 py-1 font-medium text-xs border rounded border-gray-400 hover:border-gray-600 dark:border-gray-700 dark:hover:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-900">
        <span>Learn more</span>
        <Icon name="material-symbols:arrow-outward-rounded" class="inline-block w-4 h-4" />
      </NuxtLink>
    </div>
    <div class="absolute top-2 right-1">
      <AppButton class="font-semibold" variant="link" size="xs" icon="carbon:close" @click="preferNoBanner" />
    </div>
  </div>
</template>

<style>
.hide-banner .template-banner{
  display: none;
}
</style>
