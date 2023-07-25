<template>
  <nav>
    <div v-if="services.length">
      <p class="font-semibold u-text-gray-900 py-1.5">
        Technical Expertise
      </p>

      <ul class="flex flex-col py-4 pr-2 gap-y-2">
        <li v-for="service in services" :key="service.key">
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
                class="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-to-r from-green-400 to-teal-400"
              />
            </span>
          </NuxtLink>
        </li>
      </ul>
    </div>

    <div v-if="regions.length">
      <p class="font-semibold u-text-gray-900 py-1.5">
        Locations
      </p>

      <ul class="flex flex-col py-4 pr-2 gap-y-2">
        <li v-for="region in regions" :key="region.key">
          <NuxtLink
            :to="region.to"
            class="relative flex items-center gap-2"
            :class="{
              'u-text-gray-900 font-medium': selectedRegion?.key === region.key,
              'u-text-gray-500 hover:u-text-gray-900 focus:u-text-gray-900': selectedRegion?.key !== region.key
            }"
          >
            <span class="relative">
              <span>{{ region.title }}</span>

              <span
                v-if="selectedRegion?.key === region.key"
                class="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-to-r from-green-400 to-teal-600"
              />
            </span>
          </NuxtLink>
        </li>
      </ul>
    </div>
  </nav>
</template>

<script setup lang="ts">
const { services, regions, selectedService, selectedRegion } = useAgencyPartners()
</script>
