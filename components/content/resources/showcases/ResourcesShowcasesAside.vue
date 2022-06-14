<template>
  <nav>
    <p class="py-1.5 font-semibold u-text-gray-900">
      Categories
    </p>

    <ul v-if="categories.length" class="flex flex-col py-4 gap-y-2">
      <li v-for="category in categories" :key="category.id">
        <NuxtLink
          :to="category.to"
          class="relative flex"
          :class="{
            'u-text-gray-900 font-medium': selectedCategory?.name === category.name,
            'u-text-gray-500 hover:u-text-gray-900 focus:u-text-gray-900': selectedCategory?.name !== category.name
          }"
          tabindex="-1"
        >
          <span class="relative">
            {{ category.name }}

            <span
              v-if="selectedCategory?.name === category.name"
              class="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-to-r from-green-400 via-teal-400 to-indigoblue-600"
            />
          </span>
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'

defineProps({
  categories: {
    type: Array as PropType<any>,
    default: () => []
  },
  selectedCategory: {
    type: Object as PropType<any>,
    default: () => null
  }
})
</script>
