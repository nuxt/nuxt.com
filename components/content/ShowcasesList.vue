<template>
  <Page v-if="!error" id="smooth" class="pt-16 -mt-16">
    <template #aside>
      <CategorieAside :categories="categories" :selected-category="selectedCategory" />
    </template>

    <PageList>
      <template #title>
        <span class="hidden lg:block">{{ selectedCategory?.title }}</span>
        <span class="lg:hidden">Category</span>
      </template>

      <template #heading>
        <h2 class="py-1.5 font-semibold u-text-gray-900 text-lg">
          {{ selectedCategory?.title }}
        </h2>
      </template>

      <template #filters>
        <ShowcasesFilterCategory :categories="categories" :selected-category="selectedCategory" class="lg:hidden" @update:selected-category="replaceRoute('category', $event)" />
      </template>

      <ul v-if="selectedShowcases.length" class="grid grid-cols-1 gap-8 mt-8 sm:grid-cols-2 xl:grid-cols-3">
        <li v-for="(showcase, key) in selectedShowcases" :key="showcase.id">
          <ShowcasesListItem :showcase="showcase" :loading-strategy="key === 0 ? 'eager' : 'lazy'" />
        </li>
      </ul>
    </PageList>
  </Page>
  <Page v-else>
    <p class="text-center">
      Sorry an error occured while fetching showcases...
    </p>
  </Page>
</template>

<script setup lang="ts">
const { fetchList, selectedShowcases, categories, selectedCategory } = useResourcesShowcases()

const error = await fetchList()

const { createReplaceRoute } = useFilters()
const replaceRoute = createReplaceRoute('showcase')
</script>
