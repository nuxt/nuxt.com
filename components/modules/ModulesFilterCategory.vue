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
const route = useRoute()
const router = useRouter()

const { categories, selectedCategory } = useModules()

const categoriesWithPlaceholder = computed(() => [
  {
    key: '',
    title: 'All'
  },
  ...categories.value
])

const category = computed({
  get () {
    return selectedCategory.value
  },
  set (category) {
    router.replace({
      name: 'modules',
      query: {
        ...route.query,
        category: category?.key || undefined
      },
      state: {
        smooth: '#smooth'
      }
    })
  }
})
</script>
