<template>
  <USelectCustom
    v-model="sortBy"
    name="sortBy"
    icon
    :options="sorts"
    size="sm"
    value-attribute="key"
    text-attribute="label"
    class="w-36"
  />
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()

const { sorts, selectedSort } = useCommunityRepositories()

const sortBy = computed({
  get () {
    return selectedSort.value
  },
  set (sortBy: { key: string, label: string }) {
    router.push({
      name: 'community-repositories',
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
