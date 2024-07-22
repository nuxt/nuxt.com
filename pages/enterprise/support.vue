<script setup lang="ts">
const carousel = ref()
const carouselCard = ref()
const route = useRoute()
const intervalId = ref()

const { isOutside } = useMouseInElement(carousel)

const { data: page } = await useAsyncData(route.path, () => queryContent(route.path).findOne())
if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

const title = page.value.head?.title || page.value?.title
const description = page.value?.head?.description || page.value?.description
useSeoMeta({
  titleTemplate: '%s · Enterprise',
  title,
  description,
  ogDescription: description,
  ogTitle: `${title} · Enterprise`
})

defineOgImageComponent('Docs', {
  headline: 'Enterprise'
})

onMounted(() => {
  setTimeout(() => {
    carousel.value.select(2)

    intervalId.value = setInterval(() => {
      if (isOutside.value) {
        if (!carousel.value) return

        if (carousel.value.page === carousel.value.pages) {
          return carousel.value.select(0)
        }

        carousel.value.next()
      }
    }, 3000)
  }, 100)
})

onBeforeUnmount(() => {
  clearInterval(intervalId.value)
})
</script>

<template>
  <UPage v-if="page">
    <UContainer>
      <UPageHero :title="page.title" align="center" :links="page.hero.links">
        <template #description>
          <span v-html="page.description" />
        </template>
      </UPageHero>
    </UContainer>

    <ULandingSection>
      <EnterpriseSupportLogoCarousel :logos="page.logos" />
    </ULandingSection>

    <ULandingSection v-bind="page.service" align="left">
      <UPageGrid :ui="{ wrapper: 'xl:grid-cols-2' }">
        <UPageCard v-for="service in page.service.services" :key="service.title" v-bind="service" :ui="{ background: 'card-bg', icon: { base: 'size-8' } }" />
      </UPageGrid>
    </ULandingSection>

    <ULandingSection v-bind="page.expertise">
      <div class="flex justify-center w-full gap-4 sm:gap-x-16 md:gap-x-[92px]">
        <div v-for="logo in page.expertise.logos" :key="logo.src" class="flex items-center justify-center">
          <EnterpriseSupportExpertiseCircle ref="carouselCard" :logo="logo" />
        </div>
      </div>
    </ULandingSection>

    <ULandingSection v-bind="page.testimonials" />

    <div class="relative pb-24 sm:pb-32 flex flex-col gap-16 sm:gap-y-24">
      <div class="relative">
        <div class="hidden lg:block w-1/3 h-[400px] bg-gradient-to-r from-white/90 via-white/60 dark:from-gray-950/90 dark:via-gray-950/60 to-transparent absolute left-0 -top-10 z-10" />
        <div class="hidden lg:block w-1/3 h-[400px] bg-gradient-to-l from-white/90 via-white/60 dark:from-gray-950/90 dark:via-gray-950/60 to-transparent absolute right-0 -top-10 z-10" />
        <UCarousel
          ref="carousel"
          v-slot="{ item }"
          :items="page.testimonials.items"
          indicators
          :ui="{ container: 'pl-4 pr-4 lg:pl-[30%] lg:pr-[30%] py-4 -mt-12', item: 'basis-full w-full lg:max-w-[582px] first:pl-0.5 px-4 last:pr-0.5', indicators: { wrapper: '-bottom-4', inactive: 'bg-gray-200 mix-blend-normal' } }"
        >
          <div class="mx-auto w-full h-full">
            <EnterpriseSupportClientCard v-bind="item" :ui="{ background: 'card-bg h-full', body: { base: 'flex flex-col justify-between h-full' } }" />
          </div>
        </UCarousel>
      </div>
    </div>

    <ULandingSection v-bind="page.project" align="left" :ui="{ links: 'mt-8 flex flex-wrap justify-center lg:justify-start gap-x-3 gap-y-1.5', base: 'text-center lg:text-left flex flex-col items-center lg:items-start' }">
      <div class="w-full flex flex-col items-center justify-center">
        <div class="flex flex-col space-y-4">
          <div class="flex lg:space-x-4 relative">
            <div class="absolute left-4 top-0 h-full hidden lg:block w-2">
              <svg
                width="2"
                height="150"
                viewBox="0 0 2 150"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                class="absolute left-4 -top-12 h-full z-[-1] text-gray-300 dark:text-gray-700"
              >
                <path d="M1 0L1 153" stroke="currentColor" stroke-dasharray="4 4" />
                <path d="M1 142L1 295" stroke="currentColor" stroke-dasharray="4 4" />
              </svg>
            </div>
            <ul class="flex flex-col gap-y-4 pt-1">
              <li v-for="step in page.project.steps" :key="step.title" class="flex gap-x-3">
                <div
                  class="h-8 w-8 flex items-center justify-center border border-1 border-gray-300 dark:border-gray-700 rounded-full bg-white dark:bg-gray-900 px-3 py-1"
                >
                  {{ step.number }}
                </div>
                <div class="pt-1">
                  <h3 class="font-bold">
                    {{ step.title }}
                  </h3>
                  <p class="text-gray-600 dark:text-gray-400 text-[15px]">
                    {{ step.description }}
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </ULandingSection>

    <!-- eslint-disable vue/no-deprecated-slot-attribute -->
    <ULandingSection :title="page.form.title" :description="page.form.description" :ui="{ container: 'gap-y-0 sm:gap-y-0' }">
      <div class="pt-8 w-full flex justify-center">
        <EnterpriseSupportFormSection :form="page.form" />
      </div>
    </ULandingSection>
  </UPage>
</template>

<style scoped lang="postcss">
.dark .card-bg {
  background: linear-gradient(0deg, rgba(15, 23, 42, 0.20) 0%, rgba(15, 23, 42, 0.20) 100%), linear-gradient(180deg, rgba(51, 65, 85, 0.50) 0%, rgba(2, 4, 32, 0.50) 33.92%);
}
</style>
