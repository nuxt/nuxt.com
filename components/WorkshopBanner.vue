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
  <div ref="workshopBanner" class="relative w-full bg-white dark:bg-black z-50 workshop-banner">
    <div class="flex flex-wrap sm:flex-row justify-center items-center gap-x-3.5 p-2">
      <p class="text-xs sm:text-sm text-left sm:text-center items-center text-black dark:text-white justify-center items-center">
        📣 JUST RELEASED ! Try out ouf first workshop and level up to Nuxt 3 !
      </p>
      <AppButton class="font-semibold" variant="transparent" size="xs" trailing-icon="material-symbols:arrow-right-alt" to="https://docs.google.com/forms/d/e/1FAIpQLScv6M2XJOLOK2t6tQnw6oXTritmH-K3fPkgX7ftVMxodNEJig/viewform">
        Register now
      </AppButton>
      <div class="flex flex-row justify-end absolute inset-y-0 right-4">
        <AppButton class="font-semibold" variant="transparent" size="xs" icon="carbon:close" @click="preferNoBanner" />
      </div>
    </div>
  </div>
</template>

<style>
.hide-banner .workshop-banner{
  display: none;
}
</style>
