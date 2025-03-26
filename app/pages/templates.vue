<script lang="ts" setup>
definePageMeta({
  heroBackground: 'opacity-80 -z-10'
})
const { data: page } = await useAsyncData('templates-landing', () => queryCollection('landing').path('/templates').first())
if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

const title = page.value.title
const description = page.value.description

const { data: templates } = await useAsyncData('templates', () => queryCollection('templates').all())

const featuredTemplates = computed(() => templates.value?.filter(template => template.featured) || [])
const baseTemplates = computed(() => templates.value?.filter(template => !template.featured) || [])

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
      :links="page.links"
    />
    <UPage>
      <UPageBody>
        <div v-if="featuredTemplates.length" class="mb-24">
          <h2 class="text-2xl font-semibold mb-4 text-(--ui-text-highlighted)">
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
          <h2 class="text-2xl font-semibold mb-4 text-(--ui-text-highlighted)">
            Other
          </h2>
          <UPageGrid class="lg:grid-cols-3 xl:grid-cols-4">
            <TemplateCard
              v-for="(template, index) in baseTemplates"
              :key="template.slug"
              :template="template"
              :index="index"
            />
          </UPageGrid>
        </div>
      </UPageBody>
    </UPage>
  </UContainer>
</template>
