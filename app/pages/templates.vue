<script lang="ts" setup>
import type { ButtonProps } from '@nuxt/ui'
import { clientContent } from '~/composables/client-content'

definePageMeta({
  heroBackground: 'opacity-80 -z-10'
})
const [{ data: page }, { data: templates }] = await Promise.all([
  useAsyncData('templates-landing', () => clientContent.get('/templates')),
  useAsyncData('templates', async () => {
    const items = await clientContent.list('local')
    return items.filter(i => i.path.startsWith('/templates/') && i.path !== '/templates')
  })
])

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

const title = page.value.data.head?.title || page.value.data.title
const description = page.value.data.head?.description || page.value.data.description

const featuredTemplates = computed(() => templates.value?.filter(template => template.data.featured) || [])
const baseTemplates = computed(() => templates.value?.filter(template => !template.data.featured) || [])

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
      :links="(page.data.links as ButtonProps[])"
    />
    <UPage>
      <UPageBody>
        <div v-if="featuredTemplates.length" class="mb-24">
          <h2 class="text-2xl font-semibold mb-4 text-highlighted">
            Featured
          </h2>
          <UPageGrid class="lg:grid-cols-3 xl:grid-cols-4">
            <TemplateCard
              v-for="(template, index) in featuredTemplates"
              :key="template.path"
              :template="template"
              :index="index"
            />
          </UPageGrid>
        </div>

        <div>
          <h2 class="text-2xl font-semibold mb-4 text-highlighted">
            Other
          </h2>
          <UPageGrid class="lg:grid-cols-3 xl:grid-cols-4">
            <TemplateCard
              v-for="(template, index) in baseTemplates"
              :key="template.path"
              :template="template"
              :index="index + featuredTemplates.length"
            />
          </UPageGrid>
        </div>
      </UPageBody>
    </UPage>
  </UContainer>
</template>
