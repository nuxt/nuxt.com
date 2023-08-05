<script setup lang="ts">
const { data: page } = await useAsyncData('index', () => queryContent('/').findOne())

useContentHead(page)
</script>

<template>
  <div v-if="page">
    <ULandingHero v-bind="page.hero" :ui="{ base: 'relative z-[1]' }">
      <template #title>
        <span v-html="page.hero?.title" />
      </template>

      <template #description>
        <span v-html="page.hero?.description" />
      </template>

      <div class="absolute top-[120px] w-96 h-96 inset-x-0 mx-auto bg-gradient-radial from-primary to-white dark:to-gray-900 opacity-25 blur-2xl lg:scale-125" />

      <div class="mt-32 sm:mt-48">
        <p class="text-center text-lg font-semibold leading-8 text-highlight">
          Trusted by the best frontend teams
        </p>

        <div class="flex items-center justify-between text-muted gap-8 mt-10">
          <BrandsGithub class="hidden md:block h-7" />
          <BrandsOpenai class="h-5 md:h-8" />
          <BrandsNasa class="h-4 md:h-6" />
          <BrandsGoogle class="h-5 md:h-8" />
          <BrandsFedora class="h-4 md:h-7" />
          <BrandsGitlab class="hidden sm:block h-4 md:h-7" />
          <BrandsUpwork class="hidden md:block h-8" />
        </div>
      </div>
    </ULandingHero>

    <div class="bg-gradient-to-b from-surface to-overlay" />

    <!-- eslint-disable-next-line vue/no-deprecated-slot-attribute -->
    <ULandingSection v-for="(section, index) of page.sections" :key="index" :slot="section.slot" :class="section.class" :align="section.align">
      <template #title>
        <span v-html="section?.title" />
      </template>

      <template v-if="section.description" #description>
        <span v-html="section.description" />
      </template>

      <template #features>
        <HomeSectionFeatures :features="section.features" />
      </template>

      <template #integrations>
        <HomeSectionIntegrations :integrations="section.integrations" />
      </template>

      <template #contributors>
        <HomeSectionContributors />
      </template>

      <template #testimonials>
        <HomeSectionTestimonials :testimonials="section.testimonials" />
      </template>
    </ULandingSection>
  </div>
</template>
