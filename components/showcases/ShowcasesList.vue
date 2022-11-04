<template>
  <Page id="smooth" class="page">
    <template #aside>
      <ShowcasesAside />
    </template>

    <PageList>
      <template #title class="page-title">
        <span>{{ selectedCategory?.label }}</span>
        <span>Category</span>
      </template>

      <template #filters class="page-filters">
        <ShowcasesFilterCategory />
      </template>

      <ul v-if="selectedShowcases.length">
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

<style scoped lang="ts">
css({
  '.page': {
    paddingTop:'4rem',
    marginTop: '-4rem',
  },
  '.page-title': {
    'span:first-of-type': {
      display: 'none',
      '@mq.lg': {
        display: 'block',
      },
    },
    'span:last-of-type': {
      '@mq.lg': {
        display: 'hidden',
      },
    },
  },
  '.page-filters': {
    '@mq.lg': {
      display: 'none',
    },
  },
  ul: {
    display: 'grid',
    marginTop: '2rem',
    gridTemplateColumns: 'repeat(1, minmax(0, 1fr))',
    gap: '2rem',
    '@mq.sm': {
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    },
    '@mq.xl': {
      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    },
  }
})
</style>
