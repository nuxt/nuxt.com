<script setup lang="ts">
import { joinURL } from 'ufo'

definePageMeta({
  heroBackground: 'z-10'
})
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
  <div v-if="page">
    <UPageHero
      class="relative z-[1] dark:bg-gradient-to-b from-(--ui-color-neutral-950) to-(--ui-color-neutral-900) md:pb-24"
      :orientation="uwuCookie ? 'horizontal' : 'vertical'"
    >
      <template #top>
        <HomeHeroBackground v-if="!uwuCookie" class="absolute -top-[--header-height] pointer-events-none inset-x-0 w-full hidden lg:block" />
      </template>

      <template #headline>
        <NuxtLink :to="page.hero.cta.to">
          <UBadge variant="subtle" size="lg" class="relative rounded-full font-semibold dark:hover:bg-primary-400/15 dark:hover:ring-primary-700">
            {{ page?.hero.cta.label }}
            <UIcon
              v-if="page?.hero.cta.icon"
              :name="page?.hero.cta.icon"
              class="ml-1 w-4 h-4 pointer-events-none"
            />
          </UBadge>
        </NuxtLink>
      </template>

      <template #title>
        The Intuitive<br><span class="text-(--ui-primary) block lg:inline-block">Vue Framework</span>
      </template>

      <template #description>
        Nuxt is an
        <NuxtLink
          to="https://go.nuxt.com/github"
          target="_blank"
          class="font-medium hover:underline underline-offset-2"
        >
          open source framework
        </NuxtLink> that makes web development intuitive and powerful.<br>Create performant and production-grade full-stack web apps and websites with confidence.
      </template>

      <template #links>
        <div class="flex flex-col gap-4">
          <div class="flex items-center gap-2">
            <UButton to="/docs/getting-started/installation" trailing-icon="i-ph-arrow-right" size="lg">
              Get Started
            </UButton>
            <UButton size="lg" color="neutral" variant="ghost" trailing-icon="i-ph-play-circle" @click="videoModalOpen = true">
              Nuxt in 100 Seconds
            </UButton>
          </div>
          <UInputCopy value="npm create nuxt@latest" label="npm create nuxt@latest" />
        </div>

        <UModal v-model:open="videoModalOpen" :ui="{ content: 'sm:max-w-4xl lg:max-w-5xl aspect-[16/9]' }">
          <template #content>
            <div class="p-3 h-full">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube-nocookie.com/embed/dCxSsr5xuL8"
                title="Nuxt in 100 Seconds by Fireship"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowfullscreen
              />
            </div>
          </template>
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
    </UPageHero>

    <UContainer>
      <UPageLogos :title="page?.logos?.title" class="lg:pt-12 text-(--ui-text-muted)">
        <BrandsGithub class="hidden md:block h-7" />
        <BrandsOpenai class="h-5 md:h-8" />
        <BrandsNasa class="h-4 md:h-6" />
        <BrandsGoogle class="h-5 md:h-8" />
        <BrandsFedora class="h-4 md:h-7" />
        <BrandsGitlab class="hidden sm:block h-4 md:h-7" />
        <BrandsUpwork class="hidden md:block h-8" />
      </UPageLogos>
    </UContainer>

    <UPageSection
      v-for="(section, index) of page.sections"
      :key="index"
      :class="section.class"
      :align="section.align"
      :links="section.links"
    >
      <template #title>
        <MDC :value="section?.title" />
      </template>

      <template v-if="section.description" #description>
        <MDC :value="section.description" />
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
    </UPageSection>
  </div>
</template>
