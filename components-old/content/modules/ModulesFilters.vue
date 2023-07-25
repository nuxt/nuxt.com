<template>
  <div v-if="filters.length" class="flex items-center gap-1.5">
    <AppButton
      v-for="filter of filters"
      :key="filter.key"
      :label="filter.title"
      :to="filter.to?.query"
      icon="uil:multiply"
      variant="gray"
      trailing
      rounded
      size="xs"
    />
  </div>
</template>

<script setup lang="ts">
import type { PropType, ComputedRef } from 'vue'
import type { FilterItem } from '../../../types'

const props = defineProps({
  selectedCategory: {
    type: Object as PropType<FilterItem | null>,
    default: () => ({})
  },
  selectedType: {
    type: Object as PropType<FilterItem | null>,
    default: () => ({})
  },
  q: {
    type: String,
    default: ''
  }
})

const route = useRoute()

const filters: ComputedRef<(FilterItem)[]> = computed(() => {
  return [
    props.selectedCategory,
    props.selectedType && {
      ...props.selectedType,
      to: {
        name: 'modules',
        query: {
          ...route.query,
          type: route.query?.type !== props.selectedType.key ? props.selectedType.key : undefined
        },
        state: { smooth: '#smooth' }
      }
    },
    props.q && {
      key: 'q',
      title: props.q,
      to: {
        name: 'modules',
        query: {
          ...route.query,
          q: undefined
        },
        state: {
          stop: 'true'
        }
      }
    }
  ].filter(Boolean) as FilterItem[]
})
</script>
