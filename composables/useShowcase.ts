import type { ShowcaseList, Filter, ShowcaseListGroupItem } from '../types'

export const useShowcase = () => {
  const route = useRoute()
  const router = useRouter()
  const loadingIndicator = useLoadingIndicator()

  const showcaseList = useState<ShowcaseList>('showcase', () => null)

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

  async function fetchList () {
    if (showcaseList.value) {
      return
    }

    const res = await $fetch<ShowcaseList>('https://api.nuxt.com/showcase')

    // ensure groups & showcases are well sorted
    res?.groups?.sort((a, b) => Number(a.position) - Number(b.position))
    res?.groups?.forEach((group) => {
      group.showcases.sort((a, b) => Number(a.position) - Number(b.position))
    })

    showcaseList.value = res
  }

  watch(() => route.query, () => {
    loadingIndicator.finish()
  })
  // Lists

  const categories = computed<Filter[]>(() => {
    return showcaseList.value?.groups?.map(group => ({
      key: group.id,
      label: group.name,
      exact: true,
      exactQuery: true,
      to: { name: 'showcase', query: group.name === 'Featured' ? undefined : { category: group.name }, state: { smooth: '#smooth' } },
      icon: iconsMap[group.name as keyof typeof iconsMap],
      click: (e) => {
        if (route.query.category !== group.name) {
          return
        }

        e.preventDefault()

        router.replace({ query: { ...route.query, category: undefined } })
      }
    })) || []
  })

  const selectedCategory = computed(() => {
    return categories.value.find(category => category.label === route.query.category) || categories.value[0]
  })

  const selectedShowcases = computed<ShowcaseListGroupItem[]>(() => {
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
