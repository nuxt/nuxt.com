<script setup lang="ts">
const { data: page } = await useAsyncData('blog-landing', () => queryCollection('landing').path('/blog').first())
if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}
definePageMeta({
  heroBackground: 'opacity-70 -z-10'
})
const { fetchList, articles } = useBlog()

useHead({
  link: [
    {
      rel: 'alternate',
      type: 'application/atom+xml',
      title: 'Nuxt Blog RSS',
      href: 'https://nuxt.com/blog/rss.xml'
    }
  ]
})
useSeoMeta({
  titleTemplate: '%s',
  title: page.value.title,
  description: page.value.description,
  ogDescription: page.value.description,
  ogTitle: page.value.title
})
defineOgImageComponent('Docs')

await fetchList()
</script>

<template>
  <UContainer>
    <UPageHero v-bind="page" :ui="{ title: 'text-left', description: 'text-left', links: 'justify-start' }">
      <template #links>
        <NewsletterForm class="flex-1 max-w-xs" :description="null" />
      </template>
      <template #description>
        {{ page.description }}
        <UButton
          to="/blog/rss.xml"
          color="neutral"
          external
          icon="i-ph-rss"
          variant="subtle"
          size="xs"
          target="_blank"
        >
          RSS
        </UButton>
      </template>
    </UPageHero>

    <UBlogPosts class="mb-12 lg:grid-cols-2">
      <UBlogPost
        v-for="article in articles"
        :key="article.path"
        :to="article.path"
        :title="article.title"
        :description="article.description"
        :image="{ src: article.image, width: 592, height: 333, placeholder: [59, 33, 50, 4], format: 'webp' }"
        :date="formatDateByLocale('en', article.date)"
        :authors="article.authors"
        :badge="{ label: article.category, color: 'primary', variant: 'subtle' }"
      />
    </UBlogPosts>
  </UContainer>
</template>
