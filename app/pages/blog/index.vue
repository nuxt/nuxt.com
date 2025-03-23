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
defineOgImageComponent('Docs', {
  title: page.value.title,
  description: page.value.description
})

await fetchList()
</script>

<template>
  <UContainer v-if="page">
    <UPageHero
      :title="page.title"
      :description="page.description"
      orientation="horizontal"
    >
      <template #links>
        <NewsletterForm class="flex-1 max-w-xs" :description="undefined" />
      </template>

      <template #description>
        {{ page.description }}

        <UButton
          to="/blog/rss.xml"
          color="neutral"
          external
          icon="i-lucide-rss"
          variant="subtle"
          size="xs"
          target="_blank"
        >
          RSS
        </UButton>
      </template>
    </UPageHero>

    <UPageBody>
      <UContainer>
        <UBlogPosts class="mb-12 md:grid-cols-2 lg:grid-cols-3">
          <UBlogPost
            v-for="(article, index) in articles"
            :key="article.path"
            :to="article.path"
            :title="article.title"
            :description="article.description"
            :image="{
              src: article.image,
              width: (index === 0 ? 672 : 437),
              height: (index === 0 ? 378 : 246),
              alt: `${article.title} image`
            }"
            :date="formatDateByLocale('en', article.date)"
            :authors="article.authors.map(author => ({ ...author, avatar: { ...author.avatar, alt: `${author.name} avatar` } }))"
            :badge="{ label: article.category, color: 'primary', variant: 'subtle' }"
            :variant="index === 0 ? 'outline' : 'subtle'"
            :orientation="index === 0 ? 'horizontal' : 'vertical'"
            :class="[index === 0 && 'col-span-full']"
          />
        </UBlogPosts>
      </UContainer>
    </UPageBody>
  </UContainer>
</template>
