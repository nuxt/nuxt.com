<template>
  <USelectCustom
    v-model="category"
    name="category"
    :options="categories"
    size="sm"
    placeholder="Category"
    text-attribute="title"
    class="min-w-[160px]"
  />
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { Category } from '~/types'

defineProps({
  categories: {
    type: Array as PropType<Category[]>,
    default: () => []
  },
  selectedCategory: {
    type: Object as PropType<Category | null>,
    default: null
  }
})

const emit = defineEmits(['update:selected-category'])

const category = computed({
  get () {
    return props.selectedCategory
  },
  set (category) {
    emit('update:selected-category', category.title)
  }
})
</script>
