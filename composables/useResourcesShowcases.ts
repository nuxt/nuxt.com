import type { Ref } from 'vue'
import type { ResourcesShowcasesList } from '~/types'

export const useResourcesShowcases = () => {
  const list: Ref<ResourcesShowcasesList> = useState('resources-showcases-list', () => null)
  const route = useRoute()

  const pending = ref(false)

  const iconsMap = {
    Featured: 'uil-star',
    Awwwards: 'uil-award',
    Tech: 'uil-circuit',
    'E-Commerce': 'uil-shopping-basket',
    News: 'uil-newspaper',
    Education: 'uil-graduation-cap',
    Government: 'uil-building',
    Entertainment: 'uil-dice-five',
    Travel: 'uil-plane',
    Finance: 'uil-dollar-alt',
    Business: 'uil-briefcase-alt',
    Sport: 'uil-basketball'
  }

  // Http
  async function fetch (id: number) {
    if (list.value && list.value.id === id) {
      return
    }

    pending.value = true

    try {
      const data = await $fetch<ResourcesShowcasesList>(`https://api.vuetelescope.com/lists/${id}`)

      // ensure groups & showcases are well sorted
      data.groups?.sort((a, b) => Number(a.position) - Number(b.position))
      data.groups?.forEach((group) => {
        group.showcases.sort((a, b) => Number(a.position) - Number(b.position))
      })

      list.value = data

      console.log('data', data)
    } catch (e) {
      list.value = null
    }

    pending.value = false
  }

  // Computed
  const categories = computed(() => {
    return list.value?.groups?.map(group => ({
      id: group.id,
      name: group.name,
      label: group.name,
      to: { name: 'showcase', query: { category: group.name }, state: { smooth: '#smooth' } },
      icon: iconsMap[group.name]
    })) || []
  })

  const selectedCategory = computed(() => {
    return categories.value.find(category => category.name === route.query.category) || categories.value[0]
  })

  return {
    // Http
    fetch,
    // Data
    list,
    // Computed
    categories,
    selectedCategory
  }
}
