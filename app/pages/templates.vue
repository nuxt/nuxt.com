<script lang="ts" setup>
import { clientContent } from '~/composables/client-content'
import { toSitePage } from '~/utils/content'

definePageMeta({
  heroBackground: 'opacity-80 -z-10'
})
const [{ data: page }, { data: templates }] = await Promise.all([
  useAsyncData('templates-landing', async () => {
    const file = await clientContent.get('/templates')
    return toSitePage(file)
  }),
  useAsyncData('templates', async () => {
    const items = await clientContent.list('local')
    return items
      .filter(i => i.path.startsWith('/templates/') && i.path !== '/templates')
      .map(i => toSitePage(i))
      .filter(Boolean)
  })
])

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

const title = page.value.head?.title || page.value.title
const description = page.value.head?.description || page.value.description

const featuredTemplates = computed(() => templates.value?.filter(template => template.featured) || [])
const baseTemplates = computed(() => templates.value?.filter(template => !template.featured) || [])

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
      :description="page.description"
      :links="page.links"
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
              :key="template.slug"
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
              :key="template.slug"
              :template="template"
              :index="index + featuredTemplates.length"
            />
          </UPageGrid>
        </div>
      </UPageBody>
    </UPage>
  </UContainer>
</template>
