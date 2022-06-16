<template>
  <Page id="smooth" class="pt-16 -mt-16">
    <template #aside>
      <ResourcesShowcasesAside />
    </template>

    <h2 class="hidden text-3xl font-semibold u-text-gray-900 lg:block">
      {{ selectedCategory?.label }}
    </h2>

    <div class="flex flex-col gap-3 md:flex-row md:items-center lg:hidden">
      <ResourcesShowcasesFilterCategory />
    </div>

    <ul v-if="selectedShowcases.length" class="grid min-h-[calc(100vh-18rem)] grid-cols-1 gap-8 mt-8 sm:grid-cols-2 xl:grid-cols-3">
      <li v-for="showcase in selectedShowcases" :key="showcase.id">
        <ResourcesShowcasesListItem :showcase="showcase" />
      </li>
    </ul>
  </Page>
</template>

<script setup lang="ts">
import { uniqBy } from 'lodash-es'

const { showcases, selectedCategory } = useResourcesShowcases()

// Computed
const selectedShowcases = computed(() => {
  const flattenedShowcases = showcases.value?.groups
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
