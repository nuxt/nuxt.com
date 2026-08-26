<script setup lang="ts">
definePageMeta({
  heroBackground: 'opacity-80 -z-10'
})

const { data: page } = await useAsyncData('newsletter-landing', () => useContent('site').get('/newsletter'))
if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

const pageData = computed(() => page.value!.data)

const title = pageData.value.head?.title || pageData.value.title
const description = pageData.value.head?.description || pageData.value.description
useSeoMeta({
  titleTemplate: '%s',
  title,
  description,
  ogDescription: description,
  ogTitle: title
})
useCanonical()
defineOgImage('Docs.takumi', {
  title,
  description
})
</script>

<template>
  <UContainer v-if="pageData">
    <UPageHero
      :title="pageData.title"
      :description="pageData.description"
    >
      <template #links>
        <NewsletterForm class="flex-1 max-w-xs" :label="undefined" :description="undefined" />
      </template>
    </UPageHero>

    <UPage>
      <UPageBody>
        <UPageCTA v-bind="pageData.cta" />
      </UPageBody>
    </UPage>
  </UContainer>
</template>
