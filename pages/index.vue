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

    <ULandingSection v-for="(section, index) of page.sections" :key="index" v-bind="section">
      <template #title>
        <span v-html="section?.title" />
      </template>

      <template #description>
        <span v-html="section?.description" />
      </template>

      <template #features>
        <ULandingGrid>
          <ULandingCard v-for="(feature, index) of section.features" :key="index" v-bind="feature" :class="feature.class || 'col-span-4 row-span-4'" />
        </ULandingGrid>
      </template>

      <template #accordion>
        <UAccordion v-bind="section.accordion" />
      </template>
    </ULandingSection>
  </div>
</template>

<script setup lang="ts">
const { data: page } = await useAsyncData('index', () => queryContent('/').findOne())

useContentHead(page)
</script>
