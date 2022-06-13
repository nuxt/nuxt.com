<template>
  <USelectCustom
    v-model="category"
    name="category"
    :options="categories"
    size="sm"
    placeholder="Category"
    value-attribute="name"
    text-attribute="label"
    class="w-36"
  />
</template>

<script setup lang="ts">
import type { PropType } from 'vue'

const props = defineProps({
  categories: {
    type: Array as PropType<any>,
    default: () => []
  },
  selectedCategory: {
    type: Object as PropType<any>,
    default: () => null
  }
})

const route = useRoute()
const router = useRouter()

const category = computed({
  get () {
    return props.selectedCategory
  },
  set (category) {
    router.push({
      name: 'resources-showcases',
      query: {
        ...route.query,
        category: category?.name || undefined
      },
      params: {
        smooth: '#smooth'
      }
    })
  }
})
</script>
