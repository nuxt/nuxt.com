<template>
  <nav>
    <p class="font-semibold text-lg u-text-gray-900 py-1.5">
      Categories
    </p>

    <ul v-if="categories.length" class="flex flex-col py-4 gap-y-2">
      <li v-for="category in categories" :key="category.key">
        <NuxtLink
          :to="category.to"
          class="relative flex items-center gap-2"
          :class="{
            'u-text-gray-900 font-medium': selectedCategory?.key === category.key,
            'u-text-gray-500 hover:u-text-gray-900 focus:u-text-gray-900': selectedCategory?.key !== category.key
          }"
          tabindex="-1"
        >
          <UIcon :name="category.icon" class="w-4 h-4" />

          <span class="relative">
            <span>{{ category.title }}</span>

            <span
              v-if="selectedCategory?.key === category.key"
              class="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-to-r from-green-400 via-teal-400 to-indigoblue-600"
            />
          </span>
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
const { categories, selectedCategory } = useCommunityPartners()
</script>
