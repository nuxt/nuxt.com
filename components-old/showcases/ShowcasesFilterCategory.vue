<template>
  <AppSelect
    v-model="category"
    name="category"
    :options="categories"
    size="sm"
    placeholder="Category"
    text-attribute="title"
    class="app-select-showcases-category"
  />
</template>

<script setup lang="ts">
import type { PropType, WritableComputedRef } from 'vue'
import type { FilterItem } from '../../types'

const props = defineProps({
  categories: {
    type: Array as PropType<FilterItem[]>,
    default: () => []
  },
  selectedCategory: {
    type: Object as PropType<FilterItem | undefined>,
    default: null
  }
})

const emit = defineEmits(['update:selected-category'])

const category: WritableComputedRef<FilterItem | undefined> = computed({
  get () {
    return props.selectedCategory
  },
  set (category) {
    emit('update:selected-category', category?.title)
  }
})
</script>

<style lang="ts">
css({
  'app-select-showcases-category': {
    minWidth: '160px'
  }
})
</style>
