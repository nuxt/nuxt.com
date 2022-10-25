<template>
  <Page id="smooth" class="pt-16 -mt-16">
    <template #aside>
      <ShowcasesAside />
    </template>

    <PageList>
      <template #title>
        <span class="hidden lg:block">{{ selectedCategory?.label }}</span>
        <span class="lg:hidden">Category</span>
      </template>

      <template #filters>
        <ShowcasesFilterCategory class="lg:hidden" />
      </template>

      <ul v-if="selectedShowcases.length" class="grid min-h-[calc(100vh-18rem)] grid-cols-1 gap-8 mt-8 sm:grid-cols-2 xl:grid-cols-3">
        <li v-for="showcase in selectedShowcases" :key="showcase.id">
          <ShowcasesListItem :showcase="showcase" />
        </li>
      </ul>
    </PageList>
  </Page>
</template>

<script setup lang="ts">
import { uniqBy } from 'lodash-es'

const { list, selectedCategory } = useResourcesShowcases()

// Computed
const selectedShowcases = computed(() => {
  console.log(list.value?.groups)
  const flattenedShowcases = list.value?.groups
    ?.filter((group, index) => (!selectedCategory.value && index === 0) || group.name === selectedCategory.value?.name)
    ?.map(group => ({
      ...group,
      showcases: group.showcases.map(showcase => ({
        ...showcase
      }))
    }))
    ?.flatMap(group => group.showcases)

  return uniqBy(flattenedShowcases || [], 'id')
})
</script>
