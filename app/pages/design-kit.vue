<script setup lang="ts">
definePageMeta({
  heroBackground: 'opacity-70 -z-10'
})

const { data: page } = await useAsyncData('design-kit', () => useContent('site').get('/design-kit'))
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
      :links="pageData.links"
      :description="pageData.description"
      :ui="{
        title: 'text-left',
        description: 'text-left',
        links: 'justify-start'
      }"
    />

    <UPage>
      <UPageBody>
        <UContainer>
          <MarkdownDocument v-if="page" :value="page" />
        </UContainer>
      </UPageBody>
    </UPage>
  </UContainer>
</template>
