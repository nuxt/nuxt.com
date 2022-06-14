<template>
  <Page id="smooth" class="pt-16 -mt-16">
    <template #aside>
      <ResourcesShowcasesAside :categories="categories" :selected-category="selectedCategory" />
    </template>

    <h2 class="hidden text-3xl font-semibold u-text-gray-900 lg:block">
      {{ selectedCategory?.label }}
    </h2>

    <ResourcesShowcasesFilterCategory :categories="categories" :selected-category="selectedCategory" class="lg:hidden" />

    <ul v-if="selectedShowcases.length" class="grid grid-cols-1 gap-8 mt-8 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
      <li v-for="showcase in selectedShowcases" :key="showcase.id">
        <ResourcesShowcasesListItem :showcase="showcase" />
      </li>
    </ul>
  </Page>
</template>

<script setup lang="ts">
import { uniqBy } from 'lodash-es'

const props = defineProps({
  id: {
    type: [Number, String],
    required: true
  }
})

const { data: showcases } = await useAsyncData('resources-showcases', async () => {
  const showcases = await $fetch(`https://api.vuetelescope.com/lists/${props.id}`)

  // ensure groups & showcases are well sorted
  showcases.groups?.sort((a, b) => Number(a.position) - Number(b.position))
  showcases.groups?.forEach((group) => {
    group.showcases.sort((a, b) => Number(a.position) - Number(b.position))
  })

  return showcases
})

const route = useRoute()

// Computed

const categories = computed(() => {
  return showcases.value?.groups?.map(group => ({
    id: group.id,
    name: group.name,
    label: group.name,
    to: { name: 'resources-showcases', query: { category: group.name }, params: { smooth: '#smooth' } }
  })) || []
})

const selectedCategory = computed(() => {
  const category = categories.value.find(category => category.name === route.query.category)

  return category || categories.value[0]
})

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
