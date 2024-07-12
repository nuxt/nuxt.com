<script setup lang="ts">
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
        <UPageCard v-for="service in page.service.services" :key="service.title" v-bind="service" :ui="{ background: 'card-bg', icon: { base: 'w-8 h-8' } }" />
      </UPageGrid>
    </ULandingSection>

    <ULandingSection v-bind="page.expertise">
      <div class="flex justify-center w-full gap-x-[92px]">
        <div v-for="logo in page.expertise.logos" ref="circle" :key="logo.src" class="flex items-center justify-center">
          <EnterpriseSupportExpertiseCircle :logo="logo" />
        </div>
      </div>
    </ULandingSection>

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
