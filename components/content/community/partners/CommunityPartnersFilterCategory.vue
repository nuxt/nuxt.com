<template>
  <USelectCustom
    v-model="category"
    name="category"
    :options="categoriesWithPlaceholder"
    size="sm"
    placeholder="Category"
    value-attribute="key"
    text-attribute="title"
  />
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()

const { categories, selectedCategory } = useCommunityPartners()

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
    router.push({
      name: 'community-partners',
      query: {
        ...route.query,
        category: category?.key || undefined
      },
      params: {
        smooth: '#smooth'
      }
    })
  }
})
</script>
