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
import type { ShowcaseCategory } from '~/types'

interface Props {
  categories: ShowcaseCategory[]
  selectedCategory: ShowcaseCategory
}

const props = defineProps<Props>()

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
