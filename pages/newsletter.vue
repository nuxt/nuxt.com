<script setup lang="ts">
const route = useRoute()

const { data: page } = await useAsyncData(route.path, () => queryContent(route.path).findOne())

useContentHead(page)
</script>

<template>
  <UContainer>
    <UPageHero v-bind="page">
      <template #links>
        <NewsletterForm class="flex-1 max-w-xs" :label="null" :description="null" />
      </template>
    </UPageHero>

    <UPage>
      <UPageBody>
        <ULandingCTA v-bind="page.cta" card />
      </UPageBody>
    </UPage>
  </UContainer>
</template>
