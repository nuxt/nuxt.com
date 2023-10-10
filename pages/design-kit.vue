<script setup lang="ts">
const route = useRoute()

const { data: page } = await useAsyncData(route.path, () => queryContent(route.path).findOne())

useContentHead(page)
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
