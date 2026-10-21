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
  <UPage v-if="pageData">
    <UPageHero
      :title="pageData.title"
      :description="pageData.description"
    >
      <template #links>
        <NewsletterForm class="w-full max-w-sm" label="" description="" />
      </template>
    </UPageHero>

    <UPageBody>
      <UContainer>
        <UPageCTA
          :headline="pageData.cta.headline"
          :title="pageData.cta.title"
          :description="pageData.cta.description"
          :links="pickLinks(pageData.cta.links)"
        />
      </UContainer>
    </UPageBody>
  </UPage>
</template>
