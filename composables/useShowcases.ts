import type { Ref, ComputedRef } from 'vue'
import type { ShowcasesList, FilterItem, ShowcasesListGroupItem } from '../types'

export const useShowcases = () => {
  const route = useRoute()

  const iconsMap = {
    Featured: 'i-uil-star',
    Awwwards: 'i-uil-award',
    Tech: 'i-uil-circuit',
    'E-Commerce': 'i-uil-shopping-basket',
    News: 'i-uil-newspaper',
    Education: 'i-uil-graduation-cap',
    Government: 'i-uil-building',
    Entertainment: 'i-uil-dice-five',
    Travel: 'i-uil-plane',
    Finance: 'i-uil-dollar-alt',
    Business: 'i-uil-briefcase-alt',
    Sport: 'i-uil-basketball'
  }

  // Data fetching
  const showcaseList: Ref<ShowcasesList | null> = useState('resources-showcases-list', () => null)
  const showcasesListId = 505

  async function fetchList () {
    const { data, error } = await useFetch<ShowcasesList>(`https://api.vuetelescope.com/lists/${showcasesListId}`)

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
  const categories: ComputedRef<FilterItem[] | []> = computed(() => {
    return showcaseList.value?.groups?.map(group => ({
      key: group.id,
      label: group.name,
      exact: true,
      exactQuery: true,
      to: { name: 'showcase', query: group.name === 'Featured' ? undefined : { category: group.name }, state: { smooth: '#smooth' } },
      icon: iconsMap[group.name as keyof typeof iconsMap]
    })) || []
  })

  const selectedCategory: ComputedRef<FilterItem> = computed(() => {
    return categories.value.find(category => category.label === route.query.category) || categories.value[0]
  })

  const selectedShowcases: ComputedRef<ShowcasesListGroupItem[]> = computed(() => {
    const ids = new Set<number>()
    return showcaseList.value?.groups
      ?.filter((group, index) => (!selectedCategory.value && index === 0) || group.name === selectedCategory.value?.label)
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
