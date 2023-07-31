<template>
  <div v-if="page">
    <ULandingHero v-bind="page.hero">
      <template #title>
        <span v-html="page.hero?.title" />
      </template>

      <template #description>
        <span v-html="page.hero?.description" />
      </template>

      <div class="absolute w-96 h-96 inset-x-0 -top-8 lg:scale-150 mx-auto rounded-full blur-2xl opacity-20 bg-gradient-radial from-primary-500 dark:from-primary-400 to-white dark:to-gray-800 z-[-1]" />
    </ULandingHero>

    <UContainer>
      <h2 class="text-center text-lg font-semibold leading-8 text-white">
        Trusted by the world's most innovative teams
      </h2>
      <div class="mx-auto mt-10 mb-20 grid max-w-lg grid-cols-4 items-center gap-x-8 gap-y-10 sm:max-w-xl sm:grid-cols-6 sm:gap-x-10 lg:mx-0 lg:max-w-none lg:grid-cols-5">
        <img class="col-span-2 max-h-12 w-full object-contain lg:col-span-1" src="https://tailwindui.com/img/logos/158x48/transistor-logo-white.svg" alt="Transistor" width="158" height="48">
        <img class="col-span-2 max-h-12 w-full object-contain lg:col-span-1" src="https://tailwindui.com/img/logos/158x48/reform-logo-white.svg" alt="Reform" width="158" height="48">
        <img class="col-span-2 max-h-12 w-full object-contain lg:col-span-1" src="https://tailwindui.com/img/logos/158x48/tuple-logo-white.svg" alt="Tuple" width="158" height="48">
        <img class="col-span-2 max-h-12 w-full object-contain sm:col-start-2 lg:col-span-1" src="https://tailwindui.com/img/logos/158x48/savvycal-logo-white.svg" alt="SavvyCal" width="158" height="48">
        <img class="col-span-2 col-start-2 max-h-12 w-full object-contain sm:col-start-auto lg:col-span-1" src="https://tailwindui.com/img/logos/158x48/statamic-logo-white.svg" alt="Statamic" width="158" height="48">
      </div>
    </UContainer>

    <ULandingSection v-for="(section, index) of page.sections" :key="index" v-bind="section">
      <template #title>
        <span v-html="section?.title" />
      </template>

      <template #description>
        <span v-html="section?.description" />
      </template>
    </ULandingSection>
  </div>
</template>

<script setup lang="ts">
const { data: page } = await useAsyncData('index', () => queryContent('/').findOne())

useContentHead(page)
</script>
