<template>
  <USelectCustom
    v-if="locations.length"
    v-model="location"
    name="location"
    :options="locationsWithPlaceholder"
    size="sm"
    placeholder="Location"
    text-attribute="title"
    class="min-w-[144px]"
  />
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const { locations, selectedLocation } = useAgencyPartners()

const locationsWithPlaceholder = computed(() => [
  {
    key: '',
    title: 'All'
  },
  ...locations.value
])

const location = computed({
  get () {
    return selectedLocation.value
  },
  set (location) {
    router.push({
      name: 'partners-agencies',
      query: {
        ...route.query,
        location: location?.key || undefined
      },
      state: {
        smooth: '#smooth'
      }
    })
  }
})
</script>
