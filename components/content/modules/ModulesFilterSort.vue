<template>
  <USelectCustom
    v-model="sortBy"
    name="sortBy"
    icon
    :options="sorts"
    size="sm"
    value-attribute="key"
    text-attribute="label"
  />
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()

const { sorts, selectedSort } = useModules()

const sortBy = computed({
  get () {
    return selectedSort.value
  },
  set (sortBy) {
    router.push({
      name: 'modules',
      query: {
        ...route.query,
        sortBy: sortBy?.key || undefined
      },
      params: {
        smooth: '#smooth'
      }
    })
  }
})
</script>
