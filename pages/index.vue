<script setup lang="ts">
const { data: page } = await useAsyncData('index', () => queryContent('/').findOne())

const videoModalOpen = ref(false)


useSeoMeta({
  title: 'Nuxt: The Complete Solution for Vue Developers',
  description: 'Nuxt is an open source framework that makes web development intuitive and powerful. Create performant and production-grade full-stack web apps and websites with confidence.'
})
</script>

<template>
  <div v-if="page">
    <ULandingHero :ui="{ base: 'relative z-[1]' }" class="dark:bg-gradient-to-b from-gray-950 to-gray-900">
      <template #title>
        The Complete Solution<br>for <span class="text-primary">Vue Developers</span>
      </template>
      <template #description>
        Nuxt is an <NuxtLink to="https://github.com/nuxt/nuxt" target="_blank">
          open source framework
        </NuxtLink> that makes web development intuitive and powerful.<br>Create performant and production-grade full-stack web apps and websites with confidence.
      </template>
      <template #links>
        <UButton to="/docs" icon="i-ph-rocket-launch-duotone" size="xl">
          Get Started
        </UButton>
        <UButton size="xl" color="white" icon="i-ph-video-duotone" @click="videoModalOpen = true">
          What is Nuxt?
        </UButton>
        <UModal v-model="videoModalOpen">
          <div class="p-3">
            <iframe
              width="100%"
              height="315"
              src="https://www.youtube-nocookie.com/embed/dCxSsr5xuL8"
              title="Nuxt in 100 Seconds by Fireship"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowfullscreen
            />
          </div>
        </UModal>
      </template>

      <div class="absolute top-[120px] w-96 h-96 inset-x-0 mx-auto bg-gradient-radial from-primary to-white dark:to-gray-900 opacity-25 blur-2xl lg:scale-125" />

      <div class="mt-32 sm:mt-48">
        <p class="text-center text-lg font-semibold leading-8 text-gray-900 dark:text-white">
          Trusted by the best frontend teams
        </p>

        <div class="flex items-center justify-between text-gray-500 dark:text-gray-400 gap-8 mt-10">
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

    <div class="dark:bg-gradient-to-b from-gray-950 to-gray-900" />

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
