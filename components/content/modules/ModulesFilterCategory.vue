<template>
  <USelectCustom
    v-model="category"
    name="category"
    :options="categoriesWithPlaceholder"
    size="sm"
    placeholder="Category"
    text-attribute="title"
    class="min-w-[160px]"
  />
</template>

<script setup lang="ts">
import type { PropType, ComputedRef, WritableComputedRef } from 'vue'
import type { FilterItem } from 'types'

const props = defineProps({
  categories: {
    type: Array as PropType<FilterItem[]>,
    default: () => []
  },
  selectedCategory: {
    type: Object as PropType<FilterItem | null>,
    default: () => ({})
  }
})

const emit = defineEmits(['update:selected-category'])

const categoriesWithPlaceholder: ComputedRef<(FilterItem | {
    key: string;
    title: string;
})[]> = computed(() => [
  {
    key: '',
    title: 'All'
  },
  ...props.categories
])

const category: WritableComputedRef<any> = computed({
  get () {
    return props.selectedCategory
  },
  set (category) {
    emit('update:selected-category', category)
  }
})
</script>
