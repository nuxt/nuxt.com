<template>
  <nav>
    <div class="py-1.5 flex items-center justify-between gap-3">
      <p class="font-semibold u-text-gray-900 truncate">
        Categories
      </p>

      <ModulesFilterVersion :versions="versions" :selected-version="selectedVersion" class="mr-1 -my-1" @update:selected-version="updateSelectedVersion" />
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
        >
          <span class="relative">
            {{ category.title }}

            <span
              v-if="selectedCategory?.key === category.key"
              class="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-to-r from-green-400 to-teal-400"
            />
          </span>
        </NuxtLink>
      </li>
    </ul>

    <div class="flex flex-col gap-2 pt-4 border-t u-border-gray-200">
      <NuxtLink
        to="https://github.com/nuxt/modules"
        target="_blank"
        class="flex items-center gap-2 text-sm font-medium hover:u-text-gray-900 focus:u-text-gray-900"
      >
        <Icon name="fa-brands:github" class="w-4 h-4" />
        Contribute on GitHub
      </NuxtLink>
      <NuxtLink
        to="/docs/guide/going-further/modules"
        class="flex items-center gap-2 text-sm font-medium hover:u-text-gray-900 focus:u-text-gray-900"
      >
        <Icon name="uil:book-open" class="w-4 h-4" />
        Module Author guide
      </NuxtLink>
    </div>
  </nav>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
const { categories, selectedCategory } = useModules()

interface keyLabel {
  key: string
  label: string
}

defineProps({
  size: {
    type: String as PropType<'xs' | 'sm'>,
    default: 'xs'
  },
  versions: {
    type: Array as PropType<keyLabel[]>,
    default: () => []
  },
  selectedVersion:
  {
    type: Object as PropType<keyLabel>,
    default: () => {}
  }
})

const emit = defineEmits(['update:selected-version'])

const updateSelectedVersion = (version: {key: string, label: string}) => {
  emit('update:selected-version', version)
}
</script>
