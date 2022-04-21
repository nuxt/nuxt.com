<template>
  <UContainer padded class="pt-12 pb-32">
    <div class="flex gap-4">
      <ResourcesShowcasesAside :categories="categories" :selected-category="selectedCategory" @select="selectCategory" />

      <div class="flex-1">
        <span class="font-semibold u-text-gray-900 text-3xl">
          {{ selectedCategory ? categories.find(c => c.key === selectedCategory)?.name : categories[0].name }}
        </span>

        <ul v-if="selectedShowcases.length" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 mt-8">
          <li v-for="showcase in selectedShowcases" :key="showcase.id">
            <ResourcesShowcasesListItem :showcase="showcase" />
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
