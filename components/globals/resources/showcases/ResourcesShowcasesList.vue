<template>
  <UContainer padded class="pt-12 pb-32">
    <div class="flex gap-4">
      <ResourcesShowcasesAside :categories="categories" :selected-category="selectedCategory" @select="selectCategory" />

      <div class="flex-1">
        <span class="font-semibold u-text-gray-900 text-3xl">
          {{ selectedCategory?.label }}
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

const categories = computed(() => showcases.value?.groups?.map(group => ({
  id: group.id,
  name: group.name,
  label: group.name
})) || [])

const selectedCategory = ref(null)

const selectedShowcases = computed(() => uniqBy(
  showcases.value?.groups
    ?.filter((group, index) => (!selectedCategory.value && index === 0) || group.name === selectedCategory.value?.name)
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

watch(() => route.hash, (hash) => {
  const name = hash.substring(1)

  let category
  if (hash) {
    category = categories.value?.find(category => category.name === name)
  } else {
    category = categories.value?.[0]
  }

  selectedCategory.value = category
})

// Methods

function selectCategory (category) {
  if (category.name === selectedCategory.value?.name) {
    return
  }

  let hash
  if (category.name === categories.value[0].name) {
    hash = ''
  } else {
    hash = `#${category.name}`
  }

  router.push({ hash })
}

onMounted(() => {
  const hash = route.hash.substring(1)

  let category
  if (hash) {
    category = categories.value.find(c => c.name === hash)
  } else if (categories.value.length) {
    category = categories.value[0]
  }

  selectedCategory.value = category
})
</script>
