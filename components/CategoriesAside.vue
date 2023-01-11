<template>
  <nav>
    <div class="py-1.5 flex items-center justify-between gap-3">
      <p class="py-1.5 font-semibold u-text-gray-900 text-lg">
        Categories
      </p>

      <slot name="header" />
    </div>

    <ul v-if="categories.length" class="flex flex-col py-4 gap-y-3">
      <li v-for="category in categories" :key="category.key" class="inline-flex items-center group">
        <Icon
          v-if="category.icon"
          :name="category.icon"
          class="w-5 h-5 mr-1 "
          :class="{
            'u-text-gray-900': selectedCategory?.title === category.title,
            'text-gray-400 dark:text-gray-500 group-hover:u-text-gray-900': selectedCategory?.title !== category.title
          }"
        />
        <NuxtLink
          :to="category.to"
          class="relative flex"
          :class="{
            'u-text-gray-900 font-medium': selectedCategory?.title === category.title,
            'text-gray-500 dark:text-gray-400 group-hover:u-text-gray-900 focus:u-text-gray-900': selectedCategory?.title !== category.title
          }"
        >
          <span class="relative">
            {{ category.title }}

            <span
              v-if="selectedCategory?.title === category.title"
              class="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-to-r from-green-400 to-teal-400"
            />
          </span>
        </NuxtLink>
      </li>
    </ul>
    <slot name="footer" />
  </nav>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { Category } from '~/types'

defineProps({
  categories: {
    type: Array as PropType<Category[]>,
    default: []
  },
  selectedCategory: {
    type: Object as PropType<Category | null>,
    default: null
  }
})
</script>
