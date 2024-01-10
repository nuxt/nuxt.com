<script setup lang="ts">
const route = useRoute()

const { data: page } = await useAsyncData(route.path, () => queryContent(route.path).findOne())
if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

console.log('page', page)

const title = page.value.head?.title || page.value.title
const description = page.value.head?.description || page.value.description
useSeoMeta({
  titleTemplate: '%s · Enterprise',
  title,
  description,
  ogDescription: description,
  ogTitle: `${title} · Enterprise`
})

defineOgImage({
  component: 'Docs',
  title,
  description,
  headline: 'Enterprise'
})
</script>

<template>
  <UContainer>
    <UPage v-if="page">
      <UPageHero :title="page.title" :description="page.description" align="center" />

      <UPageBody>
        <ULandingSection v-for="(section, index) of page.sections" :key="index" :slot="section.slot">
          <template #title>
            <span v-html="section?.title" />
          </template>

          <template v-if="section?.description" #description>
            <span v-html="section.description" />
          </template>

          <template #form>
            <EnterpriseSupportFormSection :form="section.form" />
          </template>

          <template #testimonials>

          </template>

          <template #faq>

          </template>
        </ULandingSection>
      </UPageBody>
    </UPage>
  </UContainer>
</template>
