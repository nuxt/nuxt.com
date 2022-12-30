<template>
  <nav>
    <p class="py-1.5 font-semibold u-text-gray-900 text-lg">
      Categories
    </p>

    <ul v-if="categories.length" class="flex flex-col py-4 gap-y-3">
      <li v-for="category in categories" :key="category.id" class="inline-flex items-center group">
        <Icon
          v-if="category.icon"
          :name="category.icon"
          class="w-5 h-5 mr-1 "
          :class="{
            'u-text-gray-900': selectedCategory?.name === category.name,
            'text-gray-400 dark:text-gray-500 group-hover:u-text-gray-900': selectedCategory?.name !== category.name
          }"
        />
        <NuxtLink
          :to="category.to"
          class="relative flex"
          :class="{
            'u-text-gray-900 font-medium': selectedCategory?.name === category.name,
            'text-gray-500 dark:text-gray-400 group-hover:u-text-gray-900 focus:u-text-gray-900': selectedCategory?.name !== category.name
          }"
        >
          <span class="relative">
            {{ category.name }}

            <span
              v-if="selectedCategory?.name === category.name"
              class="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-to-r from-green-400 to-teal-400"
            />
          </span>
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
import type { ShowcaseCategory } from '~/types'
interface Props {
  categories: ShowcaseCategory[]
  selectedCategory: ShowcaseCategory
}

defineProps<Props>()
</script>
