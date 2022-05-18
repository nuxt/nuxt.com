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
          value-attribute="key"
          text-attribute="label"
        />
        <USelect
          v-model="location"
          placeholder="Location"
          name="locations"
          :options="locations"
          size="lg"
          value-attribute="key"
          text-attribute="label"
        />
      </div>
    </div>
    <ul class="grid grid-cols-1 gap-8 mt-5 md:grid-cols-2">
      <NuxtLink
        v-for="(offer, index) in filteredOffers"
        :key="`offer-${index}`"
        :to="offer.path"
        class="px-5 border u-border-gray-300 u-bg-gray-50 rounded-xl py-7 hover:u-border-gray-700"
      >
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
import { uniqBy } from 'lodash-es'
import { LocationQueryRaw } from 'vue-router'
import slugify from '@sindresorhus/slugify'

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
  const mappedOffers = [...offers.value].map((offer) => { return { key: slugify(offer.department), label: offer.department } })
  mappedOffers.unshift({ key: 'all', label: 'All Departments' })

  return uniqBy(mappedOffers, 'key')
})

const locations = computed(() => {
  const mappedOffers = offers.value.map((offer) => { return { key: slugify(offer.location), label: offer.location } })
  mappedOffers.unshift({ key: 'all', label: 'All Locations' })

  return uniqBy(mappedOffers, 'key')
})

const selectedDepartment = computed(() => {
  return departments.value.find(department => department.key === route.query.department)
})

const selectedLocation = computed(() => {
  return locations.value.find(department => department.key === route.query.location)
})

const department = computed({
  get () {
    return selectedDepartment.value?.key
  },
  set (department) {
    router.push({
      name: 'company-careers',
      query: {
        ...route.query,
        department: department === 'all' ? undefined : department || undefined
      } as LocationQueryRaw,
      params: {
        smooth: '#smooth'
      }
    })
  }
})

const location = computed({
  get () {
    return selectedLocation.value?.key
  },
  set (location) {
    router.push({
      name: 'company-careers',
      query: {
        ...route.query,
        location: location && location === 'all' ? undefined : location || undefined
      } as LocationQueryRaw,
      params: {
        smooth: '#smooth'
      }
    })
  }
})

const filteredOffers = computed(() => {
  if (!selectedDepartment.value && !selectedLocation.value) {
    return offers.value
  }

  return offers.value.filter((offer) => {
    const departmentMatch = !selectedDepartment.value || offer.department === selectedDepartment.value.label
    const locationMatch = !selectedLocation.value || offer.location === selectedLocation.value.key
    return departmentMatch && locationMatch
  })
})

</script>
