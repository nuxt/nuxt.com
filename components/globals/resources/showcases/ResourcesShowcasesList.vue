<template>
  <UContainer padded class="pt-12 pb-32">
    <div class="flex gap-4">
      <nav class="flex-shrink-0 w-60 hidden md:block space-y-4">
        <span class="u-text-gray-900 font-semibold text-lg">Showcases</span>
        <ul class="space-y-1">
          <li
            v-for="(category, index) in categories"
            :key="category.id"
            class="u-text-gray-400 font-medium py-1 cursor-pointer"
            :class="{ 'u-text-gray-800': !selectedCategory && index === 0 || category.key === selectedCategory }"
            @click="() => selectCategory(category)"
          >
            <span class="relative">
              {{ category.name }}
              <span
                v-if="!selectedCategory && index === 0 || category.key === selectedCategory"
                class="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-to-r from-[#00DC82] via-[#34CDFE] to-[#0047E1]"
              />
            </span>
          </li>
        </ul>
      </nav>

      <div v-if="categories?.length" class="flex-1">
        <span class="font-semibold u-text-gray-900 text-3xl">
          {{ selectedCategory ? categories.find(c => c.key === selectedCategory)?.name : categories[0].name }}
        </span>

        <ul v-if="selectedShowcases.length" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 mt-8">
          <li v-for="showcase in selectedShowcases" :key="showcase.id">
            <NuxtLink :to="showcase.url" target="_blank" class="block group rounded-xl overflow-hidden border u-border-gray-50">
              <div class="aspect-w-4 aspect-h-3">
                <img
                  :src="`https://res.cloudinary.com/nuxt/image/upload/f_auto,q_auto/${showcase.screenshotUrl}`"
                  :alt="showcase.hostname"
                  width="800"
                  height="600"
                  loading="lazy"
                  class="object-cover absolute inset-0"
                >
                <div class="absolute inset-0">
                  <div class="absolute bottom-0 inset-x-0 h-[50%] hidden group-hover:block" :style="{ background: 'linear-gradient(#00000000, #00000055)' }" />
                  <div class="absolute bottom-0 inset-x-0 u-bg-gray-50 group-hover:bg-transparent">
                    <div class="flex justify-between items-center gap-1 py-2 px-4">
                      <h2 class="font-bold truncate group-hover:u-text-white">
                        {{ showcase.title }}
                      </h2>
                      <UIcon name="heroicons-outline:external-link" class="w-5 h-5 u-text-white hidden group-hover:inline flex-shrink-0" />
                    </div>
                    <p class="text-sm pb-2 px-4 truncate group-hover:hidden">
                      {{ showcase.hostname }}
                    </p>
                  </div>
                </div>
              </div>
            </NuxtLink>
          </li>
        </ul>
      </div>
    </div>
  </UContainer>
</template>

<script setup lang="ts">
import { $fetch } from 'ohmyfetch'
import uniqBy from 'lodash/uniqBy'

const props = defineProps({
  id: {
    type: [Number, String],
    required: true
  }
})

const { data: showcases } = await useAsyncData('showcases', async () => {
  const showcases = await $fetch(`https://api.vuetelescope.com/lists/${props.id}`)

  // ensure groups & showcases are well sorted
  showcases.groups?.sort((a, b) => Number(a.position) - Number(b.position))
  showcases.groups?.forEach((group) => {
    group.showcases.sort((a, b) => Number(a.position) - Number(b.position))
  })

  return showcases
})

const router = useRouter()
const route = useRoute()

const categories = computed(() => (showcases.value?.groups?.map((group) => {
  return {
    id: group.id,
    key: group.name,
    name: group.name
  }
})) || [])

const selectedCategory = ref(route.hash.substring(1))

const selectedShowcases = computed(() => uniqBy(
  showcases.value?.groups
    ?.filter((group, index) => (!selectedCategory.value && index === 0) || group.name === selectedCategory.value)
    ?.map(group => ({
      ...group,
      showcases: group.showcases.map(showcase => ({
        ...showcase
      }))
    }))
    ?.flatMap(group => group.showcases) || [],
  'id'
))

// Watch

watch(selectedCategory, (value) => {
  const url = route.path
  const hash = value ? `#${value}` : ''
  window.history.pushState('', '', `${url}${hash}`)
  // Cannot use router.push because it scrolls to top
  // router.push({ hash })
})

watch(() => route.hash, (hash) => {
  selectedCategory.value = hash.substring(1)
})

// Methods

function selectCategory (category) {
  if (category.key === selectedCategory.value) {
    return
  }
  if (category.key === categories.value[0].key) {
    selectedCategory.value = ''
  } else {
    selectedCategory.value = category.key
  }
}
</script>
