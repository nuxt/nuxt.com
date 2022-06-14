<template>
  <USelectCustom
    v-model="category"
    name="category"
    :options="categories"
    size="sm"
    placeholder="Category"
    value-attribute="name"
    text-attribute="label"
    class="min-w-[160px]"
  />
</template>

<script setup lang="ts">
const { categories, selectedCategory } = useResourcesShowcases()

const route = useRoute()
const router = useRouter()

const category = computed({
  get () {
    return selectedCategory.value
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
