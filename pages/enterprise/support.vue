<script setup lang="ts">
const carousel = ref()
const carouselCard = ref()

const route = useRoute()

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

    setInterval(() => {
      if (!carousel.value) return

      if (carousel.value.page === carousel.value.pages) {
        return carousel.value.select(0)
      }

      carousel.value.next()
    }, 3000)
  }, 100)
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
      <div class="flex justify-center w-full gap-x-[92px]">
        <div v-for="logo in page.expertise.logos" ref="circle" :key="logo.src" class="flex items-center justify-center">
          <EnterpriseSupportExpertiseCircle ref="carouselCard" :logo="logo" />
        </div>
      </div>
    </ULandingSection>

    <ULandingSection v-bind="page.testimonials" />

    <div class="relative pb-24 sm:pb-32 flex flex-col gap-16 sm:gap-y-24">
      <div class="relative">
        <div class="w-1/3 h-[300px] bg-gradient-to-r from-gray-950/90 via-gray-950/60 to-transparent absolute left-0 inset-y-0 z-10" />
        <div class="w-1/3 h-[300px] bg-gradient-to-l from-gray-950/90 via-gray-950/60 to-transparent absolute right-0 inset-y-0 z-10" />
        <UCarousel
          ref="carousel"
          v-slot="{ item }"
          autoplay
          :items="page.testimonials.items"
          indicators
          :ui="{ container: 'pl-[30%] pr-[30%] pb-4', item: 'w-full max-w-[582px] first:pl-0.5 px-4 last:pr-0.5', indicators: { wrapper: '-bottom-4' } }"
        >
          <div class="mx-auto">
            <EnterpriseSupportClientCard v-bind="item" />
          </div>
        </UCarousel>
      </div>
    </div>

    <!-- eslint-disable vue/no-deprecated-slot-attribute -->
    <ULandingSection class="py-4 sm:py-8" :ui="{ container: 'gap-y-0 sm:gap-y-0' }">
      <EnterpriseSupportFormSection :form="page.form" :call="page.call" />
      <ul class="flex space-x-10 flex-wrap justify-center mt-10">
        <li v-for="(logo) in page.logos" :key="logo" class="pt-8">
          <NuxtImg :src="logo.src" :width="logo.width" height="24" alt="" />
        </li>
      </ul>
      <UPageColumns class="my-[72px]">
        <!-- Hack for Safari -->
        <div v-for="(testimonial, index) in page.testimonials" :key="index" class="break-inside-avoid">
          <ULandingTestimonial v-bind="testimonial" :ui="{ background: 'card-bg' }" />
        </div>
      </UPageColumns>
    </ULandingSection>
    <ULandingSection :title="page.faq.title" :description="page.faq.description" class="py-4 sm:py-8">
      <ULandingFAQ :items="page.faq.items" class="pt-[72px]" />
    </ULandingSection>
  </UPage>
</template>

<style scoped lang="postcss">
.dark .card-bg {
  background: linear-gradient(0deg, rgba(15, 23, 42, 0.20) 0%, rgba(15, 23, 42, 0.20) 100%), linear-gradient(180deg, rgba(51, 65, 85, 0.50) 0%, rgba(2, 4, 32, 0.50) 33.92%);
}
</style>
