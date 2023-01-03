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
import type { PropType } from 'vue'

interface Category {
  key: string
  title: string
  to: object
}

const props = defineProps({
  categories: {
    type: Array as PropType<Category[]>,
    default: () => []
  },
  selectedCategory: {
    type: Object as PropType<Category>,
    default: () => {}
  }
})

const emit = defineEmits(['update:selected-category'])

const categoriesWithPlaceholder = computed(() => [
  {
    key: '',
    title: 'All'
  },
  ...props.categories
])

const category = computed({
  get () {
    return props.selectedCategory
  },
  set (category) {
    emit('update:selected-category', category)
  }
})
</script>
