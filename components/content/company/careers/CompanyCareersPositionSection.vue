<template>
  <UContainer padded class="my-36">
    <h2 class="text-4xl font-semibold lg:w-1/2 u-text-gray-900">
      <Markdown use="title" unwrap="p" />
    </h2>
    <div class="flex items-center justify-between mt-10">
      <p class="text-lg u-text-gray-500 lg:w-3/5">
        <Markdown use="description" unwrap="p" />
      </p>
      <div class="flex">
        <USelect
          v-model="department"
          class="mr-5"
          placeholder="Department"
          name="departments"
          :options="departments"
          size="lg"
        />
        <USelect
          v-model="location"
          placeholder="Location"
          name="locations"
          :options="locations"
          size="lg"
        />
      </div>
    </div>
    <ul class="grid grid-cols-1 gap-8 mt-5 md:grid-cols-2">
      <NuxtLink v-for="(offer, index) in filteredOffers" :key="`offer-${index}`" :to="offer.path" class="px-5 border rounded-xl py-7 hover:border-gray-700">
        <div class="flex items-center justify-between">
          <span class="text-xl font-semibold u-text-gray-900">
            {{ offer.role }}
          </span>
          <span :class="offer.badgeClass" class="px-2 py-1 rounded-lg">
            {{ offer.department }}
          </span>
        </div>
        <div class="text-base u-text-gray-900">
          {{ offer.frequency }} | {{ offer.location }}
        </div>
      </NuxtLink>
    </ul>
  </UContainer>
</template>

<script setup lang="ts">
import { uniq } from 'lodash-es'
import { LocationQueryRaw } from 'vue-router'

const route = useRoute()
const router = useRouter()

defineProps({
  listClass: {
    type: String,
    default: 'grid-cols-1 md:grid-cols-2 gap-8'
  }
})

const { data: offers } = await useAsyncData('company-careers-list', () => queryContent('/company/careers').where({
  $not: {
    path: {
      $in: ['/company/careers']
    }
  }
}).find())

const departments = computed(() => {
  return uniq(offers.value.map(offer => offer.department))
})

const locations = computed(() => {
  return uniq(offers.value.map(offer => offer.location))
})

const selectedDepartment = computed(() => {
  return departments.value.find(department => department === route.query.department)
})

const selectedLocation = computed(() => {
  return locations.value.find(department => department === route.query.location)
})

const department = computed({
  get () {
    return selectedDepartment.value
  },
  set (department) {
    router.push({
      name: 'company-careers',
      query: {
        ...route.query,
        department: department || undefined
      } as LocationQueryRaw
    })
  }
})

const location = computed({
  get () {
    return selectedLocation.value
  },
  set (location) {
    router.push({
      name: 'company-careers',
      query: {
        ...route.query,
        location: location || undefined
      } as LocationQueryRaw
    })
  }
})

const filteredOffers = computed(() => {
  if (!selectedDepartment.value && !selectedLocation.value) {
    return offers.value
  }

  return offers.value.filter((offer) => {
    const departmentMatch = !selectedDepartment.value || offer.department === selectedDepartment.value
    const locationMatch = !selectedLocation.value || offer.location === selectedLocation.value
    return departmentMatch && locationMatch
  })
})

</script>
