import type { Ref } from 'vue'
import type { ResourcesShowcasesList } from '../types'

export const useResourcesShowcases = () => {
  const showcaseList: Ref<ResourcesShowcasesList> = useState('resources-showcases-list', () => null)
  const route = useRoute()

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
  async function fetchList () {
    const showcasesListId = 505
    const { data } = await useFetch<ResourcesShowcasesList>(`https://api.vuetelescope.com/lists/${showcasesListId}`)

    if (!data) {
      console.log('error')
    }

    if (data) {
      // ensure groups & showcases are well sorted
      data.value?.groups?.sort((a, b) => Number(a.position) - Number(b.position))
      data.value?.groups?.forEach((group) => {
        group.showcases.sort((a, b) => Number(a.position) - Number(b.position))
      })

      showcaseList.value = data
    }
  }

  // Computed
  const categories = computed(() => {
    return showcaseList.value?.groups?.map(group => ({
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
    fetchList,
    // Data
    showcaseList,
    // Computed
    categories,
    selectedCategory
  }
}
