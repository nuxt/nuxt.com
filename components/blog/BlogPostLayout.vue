<template>
  <UContainer class="relative pb-16 sm:pb-32">
    <div class="py-10 sm:py-20">
      <UContainer constrained-class="max-w-4xl" class="flex flex-col items-center justify-center text-center gap-y-8" padded>
        <div class="font-semibold text-gray-400 dark:text-gray-200">
          <time>{{ formatDateByLocale('en', page.date) }}</time> - {{ page.category }}
        </div>
        <h1 class="text-5xl font-semibold u-text-gray-900">
          {{ page.title }}
        </h1>
        <p class="max-w-5xl font-medium u-text-gray-700">
          {{ page.description }}
        </p>
        <ul class="flex flex-wrap items-center justify-center gap-4">
          <li v-for="author in page.authors" :key="author.name">
            <NuxtLink :to="author.link" class="flex gap-x-2">
              <UAvatar :src="author.avatarUrl" :alt="author.name" />
              <div class="flex flex-col items-start">
                <span class="leading-5 u-text-gray-900">{{ author.name }}</span>
                <span class="text-sm text-gray-400 dark:text-gray-200">{{ `@${author.link.split('/').pop()}` }}</span>
              </div>
            </NuxtLink>
          </li>
        </ul>
      </UContainer>
    </div>

    <div class="relative xl:pt-8">
      <BlogPostToc class="max-w-4xl px-4 mx-auto xl:max-w-none sm:px-6 xl:px-0" />

      <UContainer constrained-class="max-w-4xl" class="pt-8 xl:pt-0" padded>
        <div class="relative overflow-hidden border-b u-border-gray-400">
          <ContentRenderer v-if="page" :value="page" class="pb-12 prose dark:prose-invert max-w-none" />
        </div>
        <div class="flex justify-between pt-6">
          <span class="font-semibold u-text-gray-900">Share the article</span>
          <ul class="flex gap-x-4">
            <li>
              <UButton class="!p-0 u-text-gray-900 hover:u-text-gray-700" variant="transparent" icon="uil:link" @click="copyUrl" />
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
        <div class="pt-16">
          <h2 class="pb-10 text-4xl font-semibold u-text-gray-900">
            Your journey begins
          </h2>
          <div class="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <div class="dark">
              <BlogPostCta
                button-text="Get Started"
                to="/docs"
                image-path="/assets/resources/blog/nuxt.svg"
                image-class="bottom-0 right-0"
              >
                <template #title>
                  Start now
                </template>
                <template #description>
                  How a user interacts with and experience your website is key.
                </template>
              </BlogPostCta>
            </div>

            <BlogPostCta
              button-text="Discover Nuxt Sites"
              to="/showcases"
              image-path="/assets/resources/blog/showcases.png"
            >
              <template #title>
                Watch a Showcase
              </template>
              <template #description>
                How a user interacts with and experience your website is key.
              </template>
            </BlogPostCta>
          </div>
        </div>
      </UContainer>
    </div>
  </UContainer>
</template>

<script setup lang="ts">
import type { ParsedContent } from '@nuxt/content/dist/runtime/types'
import type { PropType } from 'vue'
import { formatDateByLocale } from '../../utils'
const props = defineProps({
  page: {
    type: Object as PropType<ParsedContent>,
    required: true
  }
})
const { $clipboard } = useNuxtApp()
const socialLinks = computed(() => [
  {
    icon: 'fa-brands:linkedin',
    alt: 'LinkedIn',
    href: `https://www.linkedin.com/sharing/share-offsite/?url=https://nuxt.com${props.page._path}`
  },
  {
    icon: 'fa-brands:twitter',
    alt: 'link',
    href: `https://twitter.com/intent/tweet?text=I%20found%20this%20article%20interesting%20%20https://nuxt.com${props.page._path}&hashtags=nuxt`
  }
])
function copyUrl () {
  $clipboard.copy(`https://nuxt.com${props.page._path}`, { title: 'Copied to clipboard' })
}
</script>
