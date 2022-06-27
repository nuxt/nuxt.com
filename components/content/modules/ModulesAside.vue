<template>
  <nav>
    <div class="py-1.5 flex items-center justify-between gap-3">
      <p class="font-semibold u-text-gray-900">
        Categories
      </p>

      <ModulesFilterVersion class="mr-1 -my-1" />
    </div>

    <ul v-if="categories.length" class="flex flex-col py-4 gap-y-2">
      <li v-for="category in categories" :key="category.key">
        <NuxtLink
          :to="category.to"
          class="relative flex items-center"
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

    <div class="pt-4 border-t u-border-gray-200">
      <NuxtLink
        :to="contributeUrl"
        target="_blank"
        class="flex items-center gap-2 text-sm font-medium hover:u-text-gray-900 focus:u-text-gray-900"
        tabindex="-1"
      >
        <UIcon name="fa-brands:github" class="w-4 h-4" />
        Contribute on GitHub
      </NuxtLink>
    </div>
  </nav>
</template>

<script setup lang="ts">
const { categories, selectedCategory, contributeUrl } = useModules()
</script>
