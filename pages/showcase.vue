<script setup lang="ts">
const route = useRoute()
const { createReplaceRoute } = useFilters()
const replaceRoute = createReplaceRoute('showcase')

const { data: page } = await useAsyncData(route.path, () => queryContent(route.path).findOne())

useContentHead(page)

const { fetchList, selectedShowcases, categories, selectedCategory } = useResourcesShowcases()

const error = await fetchList()
</script>

<template>
  <UContainer>
    <UPageHero v-bind="page">
      <img :src="`${page.image.path}-light.${page.image.format}`" class="dark:hidden object-contain h-3/4 lg:ml-auto opacity-0 md:opacity-100" alt="" :width="page.image.width" :height="page.image.height">
      <img :src="`${page.image.path}-dark.${page.image.format}`" class="hidden dark:block object-contain h-3/4 lg:ml-auto opacity-0 md:opacity-100" alt="" :width="page.image.width" :height="page.image.height">
    </UPageHero>

    <UPageError v-if="error" :error="error" />
    <UPage v-else>
      <template #left>
        <UAside :links="categories" />
      </template>

      <UPageBody>
        {{ selectedShowcases }}
      </UPageBody>
    </UPage>
  </UContainer>
</template>
