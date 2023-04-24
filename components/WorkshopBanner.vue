<script setup lang="ts">
const preferNoBanner = () => {
  localStorage.setItem('preferNoWorkshopBanner', 'true')
  document.querySelector('html')?.classList.add('hide-banner')
}

if (process.server) {
  useHead({
    script: [
      {
        key: 'prehydrate-workshop-banner',
        innerHTML: `
            if (localStorage.getItem('preferNoWorkshopBanner') === 'true') {
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
      <p class="text-sm text-center items-center text-black dark:text-white justify-center">
        <span class="font-semibold">
          📣 Just Released!
        </span>
        Our official workshop to level up from Nuxt 2 to Nuxt 3.
      </p>
      <a
        class="font-semibold text-xs bg-green-400 hover:bg-green-300 text-black px-2 py-1 rounded"
        href="https://catalogue-nuxtlabs.dendreo.com"
        target="_blank"
        rel="noopener"
      >
        Register now
      </a>
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
