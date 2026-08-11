<script setup lang="ts">
import type { ButtonProps } from '@nuxt/ui'
import { clientContent } from '~/composables/client-content'

definePageMeta({
  heroBackground: 'opacity-70 -z-10'
})

const { data: page } = await useAsyncData('design-kit', () => clientContent.get('/design-kit'))
if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

const title = page.value.data.head?.title || page.value.data.title
const description = page.value.data.head?.description || page.value.data.description

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
      :title="page.data.title"
      :links="(page.data.links as ButtonProps[])"
      :description="page.data.description"
      :ui="{
        title: 'text-left',
        description: 'text-left',
        links: 'justify-start'
      }"
    />

    <UPage>
      <UPageBody>
        <UContainer>
          <MarkdownDocument v-if="page.nodes?.length" :value="page" />
        </UContainer>
      </UPageBody>
    </UPage>
  </UContainer>
</template>
