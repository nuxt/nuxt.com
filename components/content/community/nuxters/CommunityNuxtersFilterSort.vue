<template>
  <USelectCustom
    v-model="sortBy"
    name="sortBy"
    :options="sorts"
    size="sm"
    value-attribute="key"
    text-attribute="label"
    class="min-w-[144px]"
  />
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()

const { sorts, selectedSort } = useCommunityNuxters()

const sortBy = computed({
  get () {
    return selectedSort.value
  },
  set (sortBy) {
    router.push({
      name: 'community-nuxters',
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
