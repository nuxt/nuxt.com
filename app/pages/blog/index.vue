<script setup lang="ts">
definePageMeta({
  heroBackground: 'opacity-70 -z-10'
})

const { fetchList, articles } = useBlog()

const { data: page } = await useAsyncData('blog-landing', () => clientContent.get('/blog'))
if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

const title = page.value.data.head?.title || page.value.data.title
const description = page.value.data.head?.description || page.value.data.description

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
  title,
  description,
  ogDescription: description,
  ogTitle: title
})
useCanonical()
defineOgImage('Docs.takumi', {
  headline: 'Updates',
  title,
  description
})

await fetchList()
</script>

<template>
  <UContainer v-if="page">
    <UPageHero
      :title="page.data.title"
      :description="page.data.description"
      orientation="horizontal"
    >
      <template #links>
        <NewsletterForm class="flex-1 max-w-xs" :description="undefined" />
      </template>

      <template #description>
        {{ page.data.description }}

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
