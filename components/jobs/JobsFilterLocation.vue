<template>
  <USelectCustom
    v-model="location"
    name="location"
    :options="locationsWithPlaceholder"
    size="sm"
    placeholder="Location"
    class="min-w-[192px]"
  />
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()

const { locations, selectedLocation } = useNuxtJobs()

const locationsWithPlaceholder = computed(() => [
  {
    value: '',
    text: 'All'
  },
  ...locations.value
])

const location = computed({
  get () {
    return selectedLocation.value
  },
  set (location) {
    router.replace({
      name: 'partners-jobs',
      query: {
        ...route.query,
        location: location?.value || undefined
      },
      state: {
        smooth: '#smooth'
      }
    })
  }
})
</script>
