import type { Ref } from 'vue'
import { ResourcesShowcase } from '~/types'

export const useResourcesShowcases = () => {
  const showcase: Ref<ResourcesShowcase> = useState('resources-showcase', null)
  const route = useRoute()

  const pending = ref(false)

  // Http
  async function fetch (id: number) {
    if (showcase.value && showcase.value.id === id) {
      return
    }

    pending.value = true

    try {
      const data = await $fetch<ResourcesShowcase>(`https://api.vuetelescope.com/lists/${id}`)

      // ensure groups & showcases are well sorted
      data.groups?.sort((a, b) => Number(a.position) - Number(b.position))
      data.groups?.forEach((group) => {
        group.showcases.sort((a, b) => Number(a.position) - Number(b.position))
      })

      showcase.value = data
    } catch (e) {
      showcase.value = null
    }

    pending.value = false
  }

  // Computed
  const categories = computed(() => {
    return showcase.value?.groups?.map(group => ({
      id: group.id,
      name: group.name,
      label: group.name,
      to: { name: 'resources-showcases', query: { category: group.name }, params: { smooth: '#smooth' } }
    })) || []
  })

  const selectedCategory = computed(() => {
    return categories.value.find(category => category.name === route.query.category) || categories.value[0]
  })

  return {
    // Http
    fetch,
    // Data
    showcase,
    // Computed
    categories,
    selectedCategory
  }
}
