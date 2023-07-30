<script setup lang="ts">
const route = useRoute()

const { data: page } = await useAsyncData(route.path, () => queryContent(route.path).findOne())

useContentHead(page)

// const {
//   fetchList,
//   filteredModules,
//   q,
//   versions,
//   selectedVersion,
//   types,
//   selectedType,
//   categories,
//   selectedCategory,
//   orders,
//   selectedOrder,
//   sorts,
//   selectedSort
// } = useModules()

// const { createReplaceRoute } = useFilters()
// const replaceRoute = createReplaceRoute('modules')

// const error = await fetchList()
</script>

<template>
  <UContainer>
    <UPageHero v-bind="page">
      <UColorModeImage :light="`${page.image.path}-light.${page.image.format}`" :dark="`${page.image.path}-dark.${page.image.format}`" class="object-contain h-3/4 lg:ml-auto opacity-0 md:opacity-100" :width="page.image.width" :height="page.image.height" />
    </UPageHero>

    <UPage>
      <template #left>
        <UAside>
          aside
        </UAside>
      </template>

      <UPageBody>
        test
      </UPageBody>
    </UPage>
  </UContainer>
</template>
