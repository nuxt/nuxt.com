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
  <div ref="workshopBanner" class="w-full h-[36px] bg-white z-50 workshop-banner">
    <p class="text-center text-black">
      Workshop Banner
      <AppButton icon="carbon:close" @click="preferNoBanner">
        Close
      </AppButton>
    </p>
  </div>
</template>

<style>
.hide-banner .workshop-banner{
  display: none;
}
</style>
