import type { ShowcaseList, Filter } from '../types'

export const useShowcase = () => {
  const route = useRoute()
  const router = useRouter()
  const showcaseList = useState<ShowcaseList | null>('showcase', () => null)
  // Data fetching

  async function fetchList() {
    if (showcaseList.value) {
      return
    }

    const { data } = await useAsyncData('showcase', () => queryCollection('showcase').first())

    showcaseList.value = data.value
  }

  // Lists
  const categories = computed<Filter[]>(() => {
    return showcaseList.value?.groups?.map(group => ({
      key: group.name,
      label: group.name,
      exact: true,
      exactQuery: true,
      to: { name: 'showcase', query: group.name === 'Featured' ? undefined : { category: group.name }, state: { smooth: '#smooth' } },
      icon: group.icon,
      click: (e: Event) => {
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

  const selectedShowcases = computed(() => {
    const ids = new Set<string>()
    return showcaseList.value?.groups
      ?.filter((group, index) => (!selectedCategory.value && index === 0) || group.name === selectedCategory.value?.label)
      ?.flatMap((group) => {
        if (ids.has(group.name)) {
          return []
        }
        ids.add(group.name)
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
