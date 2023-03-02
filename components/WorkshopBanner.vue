<script setup lang="ts">
const workshopBanner = ref<HTMLElement>()

const preferNoBanner = () => {
  localStorage.setItem('preferNoBanner', 'true')
  workshopBanner.value?.classList.add('hidden')
}

if (process.server) {
  useHead({
    script: [
      {
        key: 'prehydrate-workshop-banner',
        innerHTML: `
            if (localStorage.getItem('preferNoBanner') === 'true') {
              document.querySelector('html').classList.add('hide-banner')
            }`.replace(/\s+/g, ' '),
        type: 'text/javascript'
      }
    ]
  })
}
</script>

<template>
  <div ref="workshopBanner" class="relative w-full bg-white dark:bg-black z-50 workshop-banner border-b border-b-gray-300 dark:border-b-gray-700">
    <div class="flex flex-wrap sm:flex-row justify-start sm:justify-center items-center gap-x-1.5 p-2">
      <p class="text-xs sm:text-sm text-left sm:text-center items-center text-black dark:text-white justify-center items-center pl-[10px] sm:pl-0 pr-10 sm:pr-0">
        <span class="font-semibold">
          📣 Just Released!
        </span>
        Try out our first workshop and level up to Nuxt 3!
      </p>
      <AppButton class="font-semibold" variant="link" size="xs" trailing-icon="material-symbols:arrow-right-alt" to="/support/workshop">
        Register now
      </AppButton>
      <div class="flex flex-row justify-end absolute inset-y-0 right-4">
        <AppButton class="font-semibold" variant="link" size="xs" icon="carbon:close" @click="preferNoBanner" />
      </div>
    </div>
  </div>
</template>

<style>
.hide-banner .workshop-banner{
  display: none;
}
</style>
