<script setup lang="ts">
definePageMeta({
  heroBackground: 'opacity-100 -z-10'
})

const { data: page } = await useAsyncData('support', () => useContent('site').get('/enterprise/support'))
if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

const pageData = computed(() => page.value!.data)

const title = pageData.value?.title
const description = pageData.value?.description

useSeoMeta({
  titleTemplate: '%s',
  title,
  description,
  ogDescription: description,
  ogTitle: title,
  ogImage: '/assets/enterprise/support/social-card.png'
})
useCanonical()
</script>

<template>
  <UPage v-if="pageData">
    <UPageHero :title="pageData.title" :description="pageData.description" :links="pageData.hero.links">
      <UPageLogos marquee>
        <UColorModeImage
          v-for="company in pageData.logos"
          :key="company.alt"
          v-bind="company"
          class="h-10 max-w-[120px] object-contain"
        />
      </UPageLogos>
    </UPageHero>

    <UPageSection
      v-bind="pageData.service"
      :ui="{
        title: 'text-left',
        description: 'text-left',
        container: 'gap-12 sm:gap-y-12'
      }"
    >
      <template #links>
        <UPageGrid class="xl:grid-cols-4">
          <UPageCard v-for="service in pageData.service.services" :key="service.title" v-bind="service" :ui="{ container: 'card-bg', leadingIcon: 'size-8' }" />
        </UPageGrid>
      </template>
    </UPageSection>

    <UPageSection v-bind="pageData.expertise">
      <div class="flex justify-center w-full gap-4 sm:gap-x-16 md:gap-x-[92px]">
        <div v-for="logo in pageData.expertise.logos" :key="logo.src" class="flex items-center justify-center">
          <EnterpriseSupportExpertiseCircle :logo="logo" />
        </div>
      </div>
    </UPageSection>

    <UPageSection v-bind="pageData.testimonials">
      <UCarousel
        v-slot="{ item }"
        :items="(pageData.testimonials.items as any[])"
        dots
        wheel-gestures
        arrows
        class="min-w-0"
        :ui="{
          container: 'ms-0',
          item: 'min-w-0 shrink-0 sm:basis-1/2 p-2',
          arrows: 'hidden 2xl:block'
        }"
      >
        <EnterpriseSupportClientCard v-bind="item" />
      </UCarousel>
    </UPageSection>

    <UPageSection
      v-bind="pageData.project"
      orientation="horizontal"
      :ui="{
        links: 'mt-8 flex flex-wrap justify-center lg:justify-start gap-x-3 gap-y-1.5',
        container: 'text-center lg:text-left flex flex-col items-center lg:items-start'
      }"
    >
      <div class="w-full flex flex-col items-center justify-center">
        <div class="flex flex-col space-y-4">
          <div class="flex lg:space-x-4 relative">
            <div class="absolute top-0 h-full hidden lg:block w-2">
              <svg
                width="2"
                height="150"
                viewBox="0 0 2 150"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                class="absolute left-4 -top-12 h-full z-[-1] text-muted"
              >
                <path d="M1 0L1 153" stroke="currentColor" stroke-dasharray="4 4" />
                <path d="M1 142L1 295" stroke="currentColor" stroke-dasharray="4 4" />
              </svg>
            </div>
            <ul class="flex flex-col text-left gap-y-4 pt-1">
              <li v-for="step in pageData.project.steps" :key="step.title" class="flex gap-x-3">
                <div
                  class="size-8 flex items-center justify-center border border-default rounded-full bg-muted px-3 py-1"
                >
                  {{ step.number }}
                </div>
                <div class="pt-1">
                  <h3 class="font-bold">
                    {{ step.title }}
                  </h3>
                  <p class="text-muted text-[15px]">
                    {{ step.description }}
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </UPageSection>

    <UPageSection
      :title="pageData.form.title"
      :description="pageData.form.description"
      :ui="{ container: 'gap-y-0 sm:gap-y-0' }"
    >
      <div class="pt-8 w-full flex justify-center">
        <EnterpriseSupportFormSection :form="pageData.form" />
      </div>
    </UPageSection>
  </UPage>
</template>
