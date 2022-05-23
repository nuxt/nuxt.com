<template>
  <nav>
    <p class="font-semibold text-lg u-text-gray-900 py-1.5">
      Categories
    </p>

    <ul v-if="categories.length" class="py-3">
      <li v-for="category in categories" :key="category.key">
        <NuxtLink
          :to="category.to"
          class="py-1.5 block relative"
          :class="{
            'u-text-gray-900 font-medium': selectedCategory?.key === category.key,
            'u-text-gray-500 hover:u-text-gray-900 focus:u-text-gray-900': selectedCategory?.key !== category.key
          }"
          tabindex="-1"
        >
          <span class="relative">
            {{ category.title }}

            <span
              v-if="selectedCategory?.key === category.key"
              class="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-to-r from-green-400 via-teal-400 to-indigoblue-600"
            />
          </span>
        </NuxtLink>
      </li>
    </ul>

    <div class="h-[1px] u-bg-gray-200" />

    <ul v-if="services.length" class="py-3">
      <li v-for="service in services" :key="service.key">
        <NuxtLink
          :to="service.to"
          class="py-1.5 block relative"
          :class="{
            'u-text-gray-900 font-medium': selectedService?.key === service.key,
            'u-text-gray-500 hover:u-text-gray-900 focus:u-text-gray-900': selectedService?.key !== service.key
          }"
          tabindex="-1"
        >
          <span class="relative">
            {{ service.title }}

            <span
              v-if="selectedService?.key === service.key"
              class="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-to-r from-green-400 via-teal-400 to-indigoblue-600"
            />
          </span>
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
const { categories, services, selectedCategory, selectedService } = useCommunityPartners()
</script>
