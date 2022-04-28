<template>
  <nav>
    <div class="py-1.5 flex items-center gap-3">
      <p class="font-semibold u-text-gray-900">
        Integrations
      </p>

      <IntegrationsFilterVersion />
    </div>

    <ul v-if="categories.length" class="py-2">
      <li v-for="category in categories" :key="category.key">
        <NuxtLink
          :to="category.to"
          class="py-1.5 block relative"
          :class="{
            'u-text-gray-900 font-medium': selectedCategory?.key === category.key,
            'u-text-gray-500 hover:u-text-gray-900 focus:u-text-gray-900': selectedCategory?.key !== category.key
          }"
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
  </nav>
</template>

<script setup lang="ts">
const { categories, selectedCategory } = useModules()
</script>
