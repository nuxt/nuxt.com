<script setup lang="ts">
import type { ButtonProps } from '@nuxt/ui'
import { clientContent } from '~/composables/client-content'

definePageMeta({
  heroBackground: 'opacity-80 -z-10'
})

const { data: page } = await useAsyncData('newsletter-landing', () => clientContent.get('/newsletter'))
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
      :description="page.data.description"
    >
      <template #links>
        <NewsletterForm class="flex-1 max-w-xs" :label="undefined" :description="undefined" />
      </template>
    </UPageHero>

    <UPage>
      <UPageBody>
        <UPageCTA
          :headline="page.data.cta?.headline"
          :title="page.data.cta?.title"
          :description="page.data.cta?.description"
          :links="(page.data.cta?.links as ButtonProps[])"
        />
      </UPageBody>
    </UPage>
  </UContainer>
</template>
