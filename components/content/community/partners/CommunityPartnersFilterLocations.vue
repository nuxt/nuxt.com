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
const partnerType: 'technologies' | 'agencies' = inject('partnerType')

const route = useRoute()
const router = useRouter()
const { locations, selectedLocation } = useCommunityPartners(partnerType)

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
      name: `community-${partnerType === 'agencies' ? partnerType : 'partners'}`,
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
