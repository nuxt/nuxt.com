<template>
  <UContainer class="relative pb-12 sm:pb-28">
    <div class="py-10 sm:py-20">
      <UContainer constrained-class="max-w-4xl" class="flex flex-col gap-y-8 items-center justify-center text-center">
        <div class="font-semibold u-text-gray-400">
          <time>{{ formatDateByLocale('en', page.date) }}</time> - {{ page.category }}
        </div>
        <h1 class="font-bold u-text-gray-900 text-5xl">
          {{ page.title }}
        </h1>
        <p class="u-text-gray-700 font-medium max-w-5xl">
          {{ page.description }}
        </p>
        <ul class="flex flex-wrap items-center justify-center gap-4">
          <li v-for="author in page.authors" :key="author.name" class="flex gap-x-1">
            <UAvatar :src="author.avatarUrl" :alt="author.name" />
            <div class="flex flex-col items-start">
              <span class="u-text-gray-900">{{ author.name }}</span>
              <a :href="author.link" class="text-sm u-text-gray-400">{{ `@${author.link.split('/').pop()}` }}</a>
            </div>
          </li>
        </ul>
      </UContainer>
    </div>

    <div class="relative">
      <!-- TODO: rework TOC -->
      <ResourcesArticlesToc :toc="page.body.toc.links" />
      <UContainer constrained-class="max-w-4xl" class="pt-8 lg:pt-0">
        <div class="relative overflow-hidden border-b u-border-gray-400">
          <Content v-if="page" :document="page" class="prose prose-gray dark:prose-invert !max-w-full pb-12" />
        </div>
        <div class="flex justify-between pt-6">
          <span class="font-bold u-text-gray-900">Share the article</span>
          <ul class="flex gap-x-4">
            <li>
              <UButton class="!p-0 u-text-gray-900 hover:u-text-gray-700" variant="transparent" icon="heroicons-outline:link" @click="copyUrl" />
            </li>
            <li v-for="social in socialLinks" :key="social.alt">
              <UButton
                :to="social.href"
                :icon="social.icon"
                variant="transparent"
                target="_blank"
                class="!p-0 u-text-gray-900"
              />
            </li>
          </ul>
        </div>
        <div class="pt-36">
          <h2 class="text-4xl u-text-gray-900 font-bold pb-10">
            Your journey begins
          </h2>
          <div class="grid grid-cols-2 gap-8">
            <ResourcesArticlesFooterCard
              button-text="Get Started"
              to="/docs/framework"
              image-path="/resources/articles/nuxt.svg"
              image-position="bottom-0 right-0"
              dark
            >
              <template #title>
                Start now
              </template>
              <template #description>
                How a user interacts with and experience your website is key.
              </template>
            </ResourcesArticlesFooterCard>
            <ResourcesArticlesFooterCard
              button-text="Discover Nuxt Sites"
              to="/showcases"
              image-path="/resources/articles/showcases.png"
            >
              <template #title>
                Watch a Showcase
              </template>
              <template #description>
                How a user interacts with and experience your website is key.
              </template>
            </ResourcesArticlesFooterCard>
          </div>
        </div>
      </UContainer>
    </div>
  </UContainer>
</template>

<script setup lang="ts">
import { withoutTrailingSlash } from 'ufo'

const route = useRoute()
const path = withoutTrailingSlash(route.path)

const { $toast, $clipboard } = useNuxtApp()

const { data: page } = await useAsyncData(`resources-articles-${path}-page`, () => queryContent(path).findOne())

const socialLinks = computed(() => [
  {
    icon: 'fa-brands:linkedin',
    alt: 'LinkedIn',
    href: `https://www.linkedin.com/sharing/share-offsite/?url=https://nuxt.com${page.value.slug}`
  },
  {
    icon: 'fa-brands:twitter',
    alt: 'link',
    href: `https://twitter.com/intent/tweet?text=I%20found%20this%20article%20interesting%20%20https://nuxt.com${page.value.slug}&hashtags=nuxt`
  }
])

function copyUrl () {
  $clipboard.copy(`https://nuxt.com${page.value.slug}`)

  $toast.success({
    title: 'Copied to clipboard!',
    timeout: 1000
  })
}

const formatDateByLocale = (locale, d) => {
  return new Date(d).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script>
