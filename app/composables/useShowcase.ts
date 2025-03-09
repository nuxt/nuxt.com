import type { ShowcaseList, Filter, ShowcaseListGroupItem } from '../types'

export const useShowcase = () => {
  const route = useRoute()
  const router = useRouter()
  const showcaseList = useState<ShowcaseList>('showcase', () => null)

  const iconsMap = {
    'Featured': 'i-lucide-star',
    'Awwwards': 'i-lucide-award',
    'Tech': 'i-lucide-circuit-board',
    'E-Commerce': 'i-lucide-shopping-cart',
    'News': 'i-lucide-newspaper',
    'Education': 'i-lucide-graduation-cap',
    'Government': 'i-lucide-building',
    'Entertainment': 'i-lucide-dices',
    'Travel': 'i-lucide-plane',
    'Finance': 'i-lucide-dollar-sign',
    'Business': 'i-lucide-briefcase',
    'Sport': 'i-lucide-volleyball'
  }

  // Data fetching

  async function fetchList() {
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
        if (ids.has(group.id)) {
          return []
        }
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
