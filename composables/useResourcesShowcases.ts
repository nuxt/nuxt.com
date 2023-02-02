import type { Ref, ComputedRef } from 'vue'
import type { ResourcesShowcasesList, FilterItem, ResourcesShowcasesListGroupItem } from '../types'

export const useResourcesShowcases = () => {
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

  // Data fetching
  const showcaseList: Ref<ResourcesShowcasesList | null> = useState('resources-showcases-list', () => null)
  const showcasesListId = 505

  async function fetchList () {
    const { data, error } = await useFetch<ResourcesShowcasesList>(`https://api.vuetelescope.com/lists/${showcasesListId}`)

    /* Missing data is handled at component level */
    if (!data.value && error.value) {
      return error.value
    }

    // ensure groups & showcases are well sorted
    data.value?.groups?.sort((a, b) => Number(a.position) - Number(b.position))
    data.value?.groups?.forEach((group) => {
      group.showcases.sort((a, b) => Number(a.position) - Number(b.position))
    })

    showcaseList.value = data.value
  }

  // Lists
  const categories: ComputedRef<FilterItem[] | []> =
 computed(() => {
   return showcaseList.value?.groups?.map(group => ({
     key: group.id,
     title: group.name,
     label: group.name,
     to: { name: 'showcase', query: { category: group.name }, state: { smooth: '#smooth' } },
     icon: iconsMap[group.name as keyof typeof iconsMap]
   })) || []
 })

  const selectedCategory: ComputedRef<FilterItem> = computed(() => {
    if (process.server) {
      return categories.value[0]
    } else {
      return categories.value.find(category => category.title === route.query.category) || categories.value[0]
    }
  })

  const selectedShowcases: ComputedRef<ResourcesShowcasesListGroupItem[]> = computed(() => {
    const ids = new Set<number>()
    return showcaseList.value?.groups
      ?.filter((group, index) => (!selectedCategory.value && index === 0) || group.name === selectedCategory.value?.title)
      ?.flatMap((group) => {
        if (ids.has(group.id)) { return [] }
        ids.add(group.id)
        return group.showcases
      }) ?? []
  })

  return {
    fetchList,
    categories,
    selectedCategory,
    selectedShowcases
  }
}
