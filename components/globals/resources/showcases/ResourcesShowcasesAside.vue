<template>
  <nav class="flex-shrink-0 w-60 hidden md:block space-y-4">
    <span class="u-text-gray-900 font-semibold text-lg">Showcases</span>
    <ul v-if="categories.length" class="space-y-1">
      <li
        v-for="category in categories"
        :key="category.name"
        class="u-text-gray-400 font-medium py-1 cursor-pointer"
        :class="{ 'u-text-gray-800': selectedCategory?.name === category.name }"
        @click="() => $emit('select', category)"
      >
        <span class="relative">
          {{ category.name }}
          <span
            v-if="selectedCategory?.name === category.name"
            class="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-to-r from-[#00DC82] via-[#34CDFE] to-[#0047E1]"
          />
        </span>
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

defineEmits(['select'])
</script>
