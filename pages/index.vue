<script setup lang="ts">
const { data: page } = await useAsyncData('index', () => queryContent('/').findOne())

useContentHead(page)
</script>

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
        <span>Trusted by the world's most innovative teams</span>
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

      <template #features>
        <UPageGrid columns="grid-cols-1 sm:grid-cols-2 ld:grid-cols-3 xl:grid-cols-4">
          <UPageCard v-for="(feature, index) in section.features" :key="index" v-bind="feature" />
        </UPageGrid>
      </template>

      <template #testimonials>
        <div class="column-1 md:columns-2 lg:columns-3">
          <UPageGrid columns="grid gap-x-4 gap-y-0 grid-cols-1">
            <UPageCard v-for="(testimonial, index) in section.testimonials" :key="index" v-bind="testimonial" class="my-2">
              <quote class="italic text-lg text-gray-700 dark:text-gray-400">
                "{{ testimonial.quote }}"
              </quote>
              <template #footer>
                <div class="flex space-x-4 items-center">
                  <UAvatar :src="testimonial.author.img" :alt="testimonial.author.name" size="md" />
                  <div class="flex flex-col">
                    <span class="font-semibold text-lg text-accent dark:text-primary-400">{{ testimonial.author.name }}</span>
                    <span class="text-sm">{{ testimonial.author.job }}</span>
                  </div>
                </div>
              </template>
            </UPageCard>
          </UPageGrid>
        </div>
      </template>
    </ULandingSection>
  </div>
</template>
