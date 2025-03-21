<script setup lang="ts">
definePageMeta({
  heroBackground: 'opacity-70 -z-10'
})

const { data: page } = await useAsyncData('design-kit', () => queryCollection('designKit').first())
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
  <UContainer>
    <UPageHero
      :title="page.title"
      :links="page.links"
      :description="page.description"
      :ui="{
        title: 'text-left',
        description: 'text-left',
        links: 'justify-start'
      }"
    />

    <UPage>
      <UPageBody>
        <UContainer>
          <ContentRenderer v-if="page && page.body" :value="page" />
        </UContainer>
      </UPageBody>
    </UPage>
  </UContainer>
</template>
