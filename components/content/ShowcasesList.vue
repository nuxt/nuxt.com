<template>
  <Page id="smooth" class="pt-16 -mt-16">
    <template #aside>
      <ShowcasesAside :categories="categories" :selected-category="selectedCategory" />
    </template>

    <PageList>
      <template #title>
        <span class="hidden lg:block">{{ selectedCategory?.label }}</span>
        <span class="lg:hidden">Category</span>
      </template>

      <template #heading>
        <h2 class="py-1.5 font-semibold u-text-gray-900 text-lg">
          {{ selectedCategory?.label }}
        </h2>
      </template>

      <template #filters>
        <ShowcasesFilterCategory class="lg:hidden" />
      </template>

      <ul v-if="selectedShowcases.length" class="grid grid-cols-1 gap-8 mt-8 sm:grid-cols-2 xl:grid-cols-3">
        <li v-for="(showcase, key) in selectedShowcases" :key="showcase.id">
          <ShowcasesListItem :showcase="showcase" :loading-strategy="key === 0 ? 'eager' : 'lazy'" />
        </li>
      </ul>
    </PageList>
  </Page>
</template>

<script setup lang="ts">
const { fetchList, selectedShowcases, categories, selectedCategory } = useResourcesShowcases()

await fetchList()
</script>
