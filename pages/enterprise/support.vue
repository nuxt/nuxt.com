<script setup lang="ts">
const route = useRoute()

const { data: page } = await useAsyncData(route.path, () => queryContent(route.path).findOne())
if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

useSeoMeta({
  titleTemplate: '%s · Nuxt Enterprise',
  title: page.value.head?.title || page.value.title,
  description: page.value.head?.description || page.value.description
})
</script>

<template>
  <UContainer>
    <UPageHero v-bind="page" />

    <UPage>
      <UPageBody prose class="prose-lg">
        <ContentRenderer v-if="page && page.body" :value="page" />
      </UPageBody>
    </UPage>
  </UContainer>
</template>
