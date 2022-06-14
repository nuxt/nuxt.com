import type { Ref } from 'vue'

export const useResourcesShowcases = () => {
  const showcases: Ref<Array<any>> = useState('resources-showcases', () => [])
  const route = useRoute()

  const pending = ref(false)

  // Http
  async function fetch (id) {
    if (showcases.value.length) {
      return
    }

    pending.value = true

    try {
      const data = await $fetch<Array<any>>(`https://api.vuetelescope.com/lists/${id}`)

      // ensure groups & showcases are well sorted
      data.groups?.sort((a, b) => Number(a.position) - Number(b.position))
      data.groups?.forEach((group) => {
        group.showcases.sort((a, b) => Number(a.position) - Number(b.position))
      })

      showcases.value = data
    } catch (e) {
      showcases.value = []
    }

    pending.value = false
  }

  // Computed
  const categories = computed(() => {
    return showcases.value?.groups?.map(group => ({
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
    showcases,
    // Computed
    categories,
    selectedCategory
  }
}
