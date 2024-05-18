<script setup lang="ts">
import { joinURL } from 'ufo'

const uwuCookie = useCookie<boolean>('uwu-mode', {
  default: () => false
})

const route = useRoute()
if ('uwu' in route.query) {
  const enableUwu = !['0', 'false'].includes(route.query.uwu as string)
  uwuCookie.value = enableUwu
}

const { data: page } = await useAsyncData('index', () => queryContent('/').findOne())

const videoModalOpen = ref(false)

const site = useSiteConfig()
const title = 'Nuxt: The Intuitive Vue Framework'
const description = 'Nuxt is an open source framework that makes web development intuitive and powerful. Create performant and production-grade full-stack web apps and websites with confidence.'
useSeoMeta({
  title,
  ogTitle: title,
  description: description,
  ogDescription: description,
  ogImage: joinURL(site.url, '/new-social.jpg'),
  twitterImage: joinURL(site.url, '/new-social.jpg')
})
</script>

<template>
  <div v-if="page" class="dark:bg-gray-900">
    <ULandingHero
      :ui="{ base: 'relative z-[1]' }"
      class="dark:bg-gradient-to-b from-gray-950 to-gray-900"
      :orientation="uwuCookie ? 'horizontal' : 'vertical'"
    >
      <template #top>
        <HomeHeroBackground v-if="!uwuCookie" class="absolute -top-[--header-height] inset-x-0 w-full hidden lg:block" />
      </template>

      <template #headline>
        <UButton v-bind="page.hero.cta" />
      </template>

      <template #title>
        The Intuitive<br><span class="text-primary block lg:inline-block">Vue Framework</span>
      </template>

      <template #description>
        Nuxt is an
        <NuxtLink
          to="https://github.com/nuxt/nuxt"
          target="_blank"
          class="text-primary hover:underline"
        >
          open source framework
        </NuxtLink> that makes web development intuitive and powerful.<br>Create performant and production-grade full-stack web apps and websites with confidence.
      </template>

      <template #links>
        <UButton to="/docs/getting-started/installation" icon="i-ph-rocket-launch-duotone" size="xl">
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

      <NuxtImg
        v-if="uwuCookie"
        sizes="343px md:455px"
        width="455"
        height="256"
        class="mx-auto lg:my-16"
        src="/uwu.png"
        alt="Nuxt Logo in uwu style"
      />
    </ULandingHero>

    <UContainer>
      <ULandingLogos :title="page?.logos?.title" class="lg:pt-12 text-gray-500 dark:text-gray-400 dark:bg-gray-900">
        <BrandsGithub class="hidden md:block h-7" />
        <BrandsOpenai class="h-5 md:h-8" />
        <BrandsNasa class="h-4 md:h-6" />
        <BrandsGoogle class="h-5 md:h-8" />
        <BrandsFedora class="h-4 md:h-7" />
        <BrandsGitlab class="hidden sm:block h-4 md:h-7" />
        <BrandsUpwork class="hidden md:block h-8" />
      </ULandingLogos>
    </UContainer>

    <!-- eslint-disable vue/no-deprecated-slot-attribute -->
    <ULandingSection
      v-for="(section, index) of page.sections"
      :key="index"
      :slot="section.slot"
      :class="section.class"
      :align="section.align"
      :links="section.links"
    >
      <template #title>
        <!-- eslint-disable-next-line vue/no-v-html -->
        <span v-html="section?.title" />
      </template>

      <template v-if="section.description" #description>
        <!-- eslint-disable-next-line vue/no-v-html -->
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

      <template #code>
        <MDC
          v-if="section.code"
          :value="section.code"
          tag="pre"
          class="prose prose-primary dark:prose-invert max-w-none dark:prose-pre:!bg-gray-800/60"
        />
      </template>
    </ULandingSection>
  </div>
</template>
