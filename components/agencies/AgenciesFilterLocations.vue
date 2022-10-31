<template>
  <USelectCustom
    v-if="regions.length"
    v-model="region"
    name="region"
    :options="regionsWithPlaceholder"
    size="sm"
    placeholder="Region"
    text-attribute="title"
    class="min-w-[144px]"
  />
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const { regions, selectedRegion } = useAgencyPartners()

const regionsWithPlaceholder = computed(() => [
  {
    key: '',
    title: 'All'
  },
  ...regions.value
])

const region = computed({
  get () {
    return selectedRegion.value
  },
  set (region) {
    router.push({
      name: 'partners-agencies',
      query: {
        ...route.query,
        region: region?.key || undefined
      },
      state: {
        smooth: '#smooth'
      }
    })
  }
})
</script>
