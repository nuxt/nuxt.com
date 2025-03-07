<script setup lang="ts">
definePageMeta({
  heroBackground: 'opacity-70 -z-10'
})
const route = useRoute()

const { data: page } = await useAsyncData(route.path, () => queryCollection('designKit').first())

const title = page.value.title
const description = page.value.description

useSeoMeta({
  titleTemplate: '%s',
  title,
  description,
  ogDescription: description,
  ogTitle: title
})
defineOgImageComponent('Docs')
</script>

<template>
  <UContainer>
    <UPageHero v-bind="page" :ui="{ title: 'text-left', description: 'text-left', links: 'justify-start' }" />

    <UPage>
      <UPageBody>
        <ContentRenderer v-if="page && page.body" :value="page" />
      </UPageBody>
    </UPage>
  </UContainer>
</template>
