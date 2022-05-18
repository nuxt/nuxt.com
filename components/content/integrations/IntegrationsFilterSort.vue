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

const { sorts, selectedSort } = useIntegrations()

const sortBy = computed({
  get () {
    return selectedSort.value
  },
  set (sortBy) {
    router.push({
      name: 'integrations',
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
