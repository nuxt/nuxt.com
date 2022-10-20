<template>
  <nav>
    <div v-if="services.length">
      <p class="font-semibold u-text-gray-900 py-1.5">
        Technical Expertise
      </p>

      <ul class="flex flex-col py-4 pr-2 gap-y-2">
        <li v-for="service in filteredServices" :key="service.key">
          <NuxtLink
            :to="service.to"
            class="relative flex items-center gap-2"
            :class="{
              'u-text-gray-900 font-medium': selectedService?.key === service.key,
              'u-text-gray-500 hover:u-text-gray-900 focus:u-text-gray-900': selectedService?.key !== service.key
            }"
          >
            <span class="relative">
              <span>{{ service.title }}</span>

              <span
                v-if="selectedService?.key === service.key"
                class="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-to-r from-green-400 via-teal-400 to-indigoblue-600"
              />
            </span>
          </NuxtLink>
        </li>
      </ul>
    </div>

    <div v-if="locations.length">
      <p class="font-semibold u-text-gray-900 py-1.5">
        Locations
      </p>

      <ul class="flex flex-col py-4 pr-2 gap-y-2">
        <li v-for="location in filteredLocations" :key="location.key">
          <NuxtLink
            :to="location.to"
            class="relative flex items-center gap-2"
            :class="{
              'u-text-gray-900 font-medium': selectedLocation?.key === location.key,
              'u-text-gray-500 hover:u-text-gray-900 focus:u-text-gray-900': selectedLocation?.key !== location.key
            }"
          >
            <span class="relative">
              <span>{{ location.title }}</span>

              <span
                v-if="selectedLocation?.key === location.key"
                class="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-to-r from-green-400 via-teal-400 to-indigoblue-600"
              />
            </span>
          </NuxtLink>
        </li>
      </ul>
    </div>
  </nav>
</template>

<script setup lang="ts">
const { services, locations, filteredPartners, selectedService, selectedLocation } = useAgencyPartners()

// Faceting filtering
const filteredLocations = computed(() => {
  if (!selectedService.value) {
    return locations.value
  }

  return locations.value.filter((location) => {
    return filteredPartners.value.filter((partner) => {
      return partner.services.map(s => s.key).includes(selectedService.value.key)
    }).map(partner => partner.location.key).includes(location.key)
  })
})
const filteredServices = computed(() => {
  if (!selectedLocation.value) {
    return services.value
  }

  return services.value.filter((service) => {
    return filteredPartners.value.filter((partner) => {
      return partner.location.key === selectedLocation.value.key
    }).flatMap(partner => partner.services).map(s => s.key).includes(service.key)
  })
})
</script>
