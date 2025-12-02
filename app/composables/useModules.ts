type ModuleStatsKeys = 'version' | 'downloads' | 'stars' | 'publishedAt' | 'createdAt'
import type { Module } from '#shared/types'
import type { Filter } from '~/types'

const iconsMap = {
  Official: 'i-lucide-medal',
  AI: 'i-lucide-brain',
  Analytics: 'i-lucide-bar-chart',
  CMS: 'i-lucide-pencil',
  CSS: 'i-lucide-palette',
  Database: 'i-lucide-database',
  Devtools: 'i-lucide-wrench',
  Ecommerce: 'i-lucide-shopping-cart',
  Extensions: 'i-lucide-puzzle',
  Fonts: 'i-lucide-type',
  Images: 'i-lucide-image',
  Libraries: 'i-lucide-library',
  Monitoring: 'i-lucide-timer',
  Payment: 'i-lucide-credit-card',
  Performance: 'i-lucide-gauge',
  Request: 'i-lucide-unplug',
  Security: 'i-lucide-shield',
  SEO: 'i-lucide-search',
  UI: 'i-lucide-layout'
}

export const moduleImage = function (icon: string = '', _size: number = 80) {
  if (!icon) return

  if (/^https?:\/\//.test(icon)) return icon

  return `https://raw.githubusercontent.com/nuxt/modules/main/icons/${icon}`
  // if (/\.svg$/.test(icon)) return `https://raw.githubusercontent.com/nuxt/modules/main/icons/${icon}`

  // return `https://ipx.nuxt.com/s_${size},f_auto/gh/nuxt/modules/main/icons/${icon}`
}

export const moduleIcon = function (category: string) {
  return iconsMap[category as keyof typeof iconsMap] || 'i-lucide-box'
}

export const useModules = () => {
  const route = useRoute()
  const router = useRouter()
  const { data, execute } = useFetch('/api/modules', {
    immediate: false,
    default: () => ({
      modules: [],
      stats: {
        maintainers: 0,
        contributors: 0,
        modules: 0
      }
    })
  })

  const stats = computed(() => data.value.stats)
  const modules = computed(() => data.value.modules || [])

  const module = useState<Module>('module', () => ({} as Module))

  // Data fetching
  async function fetchList() {
    if (modules.value.length) {
      return
    }

    return execute()
  }

  // Data

  const sorts: Filter[] = [
    { key: 'downloads', label: 'Downloads' },
    { key: 'stars', label: 'Stars' },
    { key: 'publishedAt', label: 'Updated' },
    { key: 'createdAt', label: 'Created' }
  ]

  const orders: Filter[] = [
    { key: 'desc', label: 'Desc', icon: 'i-lucide-arrow-down-wide-narrow' },
    { key: 'asc', label: 'Asc', icon: 'i-lucide-arrow-up-wide-narrow' }
  ]

  const categories = computed<Filter[]>(() => {
    return Object.keys(iconsMap)
      .map((category) => {
        return {
          key: category,
          label: category,
          active: route.query.category === category,
          to: { name: 'modules', query: category === route.query.category ? undefined : { category }, state: { smooth: '#smooth' } },
          icon: iconsMap[category as keyof typeof iconsMap] || undefined,
          click: (e: Event) => {
            if (route.query.category !== category) {
              return
            }

            e.preventDefault()

            router.replace({ query: { ...route.query, category: undefined } })
          }
        }
      })
  })

  const selectedCategory = computed(() => {
    return categories.value.find(category => category.label === route.query.category)
  })

  const selectedSort = computed(() => {
    return sorts.find(sort => sort.key === route.query.sortBy) || sorts[0]
  })

  const selectedOrder = computed(() => {
    return orders.find(order => order.key === route.query.orderBy) || orders[0]
  })

  const q = computed<string>(() => {
    return route.query.q as string
  })

  const isSponsorOrOfficial = (a: Module, b: Module) => {
    if (a.sponsor && !b.sponsor) {
      return -1
    } else if (!a.sponsor && b.sponsor) {
      return 1
    } else if (a.type === 'official' && b.type !== 'official') {
      return -1
    } else if (a.type !== 'official' && b.type === 'official') {
      return 1
    } else {
      return 0
    }
  }

  const filteredModules = computed<Module[]>(() => {
    let filteredModules = [...modules.value]
      .filter((module: Module) => {
        if (selectedCategory.value) {
          if (selectedCategory.value.key === 'Official') {
            return module.type === 'official'
          }
          if (module.category !== selectedCategory.value.key) {
            return false
          }
        }
        const queryRegExp = searchTextRegExp(q.value as string)
        if (q.value && !['name', 'npm', 'category', 'description', 'repo'].map(field => module[field as keyof Module]).filter(Boolean).some(value => typeof value === 'string' && value.search(queryRegExp) !== -1)) {
          return false
        }

        return true
      })
      .sort((a: Module, b: Module) => {
        const sortKey = selectedSort.value?.key as ModuleStatsKeys
        if (sortKey && a.stats && b.stats) {
          return (b.stats[sortKey] as number) - (a.stats[sortKey] as number)
        }
        return 0
      })

    if (selectedOrder.value?.key === 'asc') {
      filteredModules = filteredModules.reverse()
    }

    // sponsored & official modules in first place if no sort or order by
    if (!route.query.sortBy && !route.query.orderBy) {
      return filteredModules.sort(isSponsorOrOfficial)
    }
    return filteredModules
  })

  return {
    // Data fetching
    fetchList,
    // Data
    // versions,
    sorts,
    orders,
    // Computed
    stats,
    modules,
    filteredModules,
    module,
    categories,
    // types,
    // contributors,
    // stats,
    selectedCategory,
    // selectedType,
    // selectedVersion,
    selectedSort,
    selectedOrder,
    q
  }
}
