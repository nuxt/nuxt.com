<template>
  <nav>
    <div class="py-1.5 flex items-center justify-between">
      <p class="font-semibold u-text-gray-900">
        Integrations
      </p>

      <USelect
        v-model="version"
        name="version"
        :options="versions"
        size="xs"
        text-attribute="label"
        value-attribute="key"
        class="mr-px -my-1"
      />
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
import type { PropType } from 'vue'

const props = defineProps({
  selectedCategory: {
    type: Object as PropType<any>,
    default: () => null
  },
  selectedVersion: {
    type: Object as PropType<any>,
    default: () => null
  }
})

const { categories, versions } = useModules()
const route = useRoute()
const router = useRouter()

const version = computed({
  get () {
    return props.selectedVersion?.key
  },
  set (version) {
    router.push({
      name: 'integrations',
      query: {
        ...route.query,
        version: version || undefined
      },
      params: {
        smooth: '#smooth'
      }
    })
  }
})
</script>
