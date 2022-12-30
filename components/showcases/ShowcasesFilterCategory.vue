<template>
  <USelectCustom
    v-model="category"
    name="category"
    :options="categories"
    size="sm"
    placeholder="Category"
    text-attribute="label"
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

const route = useRoute()
const router = useRouter()

const category = computed({
  get () {
    return props.selectedCategory
  },
  set (category) {
    router.replace({
      name: 'showcase',
      query: {
        ...route.query,
        category: category?.name || undefined
      },
      state: {
        smooth: '#smooth'
      }
    })
  }
})
</script>
