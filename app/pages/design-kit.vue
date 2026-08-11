<script setup lang="ts">
import { clientContent } from '~/composables/client-content'
import { toSitePage } from '~/utils/content'

definePageMeta({
  heroBackground: 'opacity-70 -z-10'
})

const { data: page } = await useAsyncData('design-kit', async () => {
  const file = await clientContent.get('/design-kit')
  return toSitePage(file)
})
if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

const title = page.value.head?.title || page.value.title
const description = page.value.head?.description || page.value.description

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
  <UContainer v-if="page">
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
          <MarkdownDocument v-if="page && page.document" :value="page.document" />
        </UContainer>
      </UPageBody>
    </UPage>
  </UContainer>
</template>
