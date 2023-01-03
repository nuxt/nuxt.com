<template>
  <div v-if="filters.length" class="flex items-center gap-1.5">
    <UButton
      v-for="filter of filters"
      :key="filter.key"
      :label="filter.title"
      :to="filter.to"
      icon="uil:multiply"
      variant="gray"
      trailing
      rounded
      size="sm"
    />
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'

interface filterItem {
  key: string
  title: string
  to: object
}

const props = defineProps({
  selectedCategory: {
    type: Object as PropType<filterItem>,
    default: () => {}
  },
  selectedType: {
    type: Object as PropType<filterItem>,
    default: () => {}
  },
  q: {
    type: String,
    default: ''
  }
})

const route = useRoute()

const filters = computed(() => {
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
  ].filter(Boolean)
})
</script>
