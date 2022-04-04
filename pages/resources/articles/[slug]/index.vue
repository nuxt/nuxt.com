<template>
  <div class="pb-12 sm:pb-28 relative overflow-hidden">
    <div class="py-10 sm:py-20">
      <UContainer padded class="flex flex-col gap-y-8 items-center justify-center text-center">
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

    <UContainer padded>
      <div class="grid grid-cols-4 relative overflow-hidden border-b">
        <Content v-if="page" :document="page" class="col-span-3 prose prose-gray dark:prose-invert !max-w-full pb-12" />
        <div class="sticky top-20 col-span-1">
          blabla
        </div>
      </div>
      <div class="flex justify-between pt-6">
        <span class="font-bold u-text-gray-900">Share the article</span>
        <ul class="flex gap-x-4">
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
          <ResourcesArticleFooterCard
            title="Sart now"
            description="How a user interacts with and experience your website is key."
            button-text="Get Started"
            to="/docs/framework"
            image-path="/resources/articles/nuxt.svg"
            image-position="bottom-0 right-0"
            dark
          />
          <ResourcesArticleFooterCard
            title="Watch a Showcase"
            description="How a user interacts with and experience your website is key."
            button-text="Discover Nuxt Sites"
            to="/showcases"
            image-path="/resources/articles/showcases.png"
          />
        </div>
      </div>
    </UContainer>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const path = route.path.endsWith('/') ? route.path.slice(0, -1) : route.path

const { data: page } = await useAsyncData('resources-articles-blog', () => queryContent(path).findOne())

const socialLinks = [
  {
    icon: 'heroicons-solid:link',
    alt: 'link'
  },
  {
    icon: 'fa-brands:linkedin',
    alt: 'twitter'
  },
  {
    icon: 'fa-brands:twitter',
    alt: 'link'
  }
]

const footerCard = [
  {
    title: 'Start now',
    description: 'How a user interacts with and experience your website is key.',
    button: 'Get Started',
    to: '/docs'
  },
  {
    title: 'Watch a Showcase',
    description: 'How a user interacts with and experience your website is key.',
    button: 'Discover Nuxt sites',
    to: '/showcases'
  }
]

const formatDateByLocale = (locale, d) => {
  return new Date(d).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script>
