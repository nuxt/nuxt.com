<script setup lang="ts">
definePageMeta({
  heroBackground: 'opacity-80 -z-10'
})

const { data: page } = await useAsyncData('newsletter-landing', () => queryCollection('landing').path('/newsletter').first())
if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

const title = page.value.title
const description = page.value.description
useSeoMeta({
  titleTemplate: '%s',
  title,
  description,
  ogDescription: description,
  ogTitle: title
})
defineOgImageComponent('Docs', {
  title,
  description
})
</script>

<template>
  <UContainer v-if="page">
    <UPageHero
      :title="title"
      :description="description"
    >
      <template #links>
        <NewsletterForm class="flex-1 max-w-xs" :label="undefined" :description="undefined" />
      </template>
    </UPageHero>

    <UPage>
      <UPageBody>
        <UPageCTA v-bind="page.cta" />
      </UPageBody>
    </UPage>
  </UContainer>
</template>
