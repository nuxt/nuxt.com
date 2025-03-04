import type { Module, Filter, Stats } from '~/types'

const iconsMap = {
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
  Request: 'i-lucide-plug',
  Security: 'i-lucide-shield',
  SEO: 'i-lucide-search',
  UI: 'i-lucide-layout'
}

export const moduleImage = function (icon: string = '', size: number = 80) {
  if (!icon) return

  if (/^http(s)?:\/\//.test(icon)) return icon

  if (/\.svg$/.test(icon)) return `https://raw.githubusercontent.com/nuxt/modules/main/icons/${icon}`

  return `https://ipx.nuxt.com/s_${size},f_auto/gh/nuxt/modules/main/icons/${icon}`
}

export const moduleIcon = function (category: string) {
  return iconsMap[category as keyof typeof iconsMap] || 'i-lucide-box'
}

export const useModules = () => {
  // interface TypeMap {
  //   official: string,
  //   community: string
  //   '3rd-party': string
  // }

  const route = useRoute()
  const stats = useState<Stats>('module-stats', () => ({
    maintainers: 0,
    contributors: 0,
    modules: 0
  }))
  const modules = useState<Module[]>('modules', () => [])
  const module = useState<Module>('module', () => ({} as Module))

  // Data fetching
  async function fetchList() {
    if (modules.value.length) {
      return
    }

    const res = await $fetch<{ modules: Module[], stats: Stats }>('https://api.nuxt.com/modules')
    if (res?.modules) {
      modules.value = res.modules
      stats.value = res.stats
    }
  }

  // Data

  // const versions: Filter[] = [
  //   { key: '3.x', label: 'v3' },
  //   { key: '2.x-bridge', label: 'Bridge' },
  //   { key: '2.x', label: 'v2' }
  // ]

  const sorts: Filter[] = [
    { key: 'downloads', label: 'Downloads' },
    { key: 'stars', label: 'Stars' },
    { key: 'publishedAt', label: 'Updated' },
    { key: 'createdAt', label: 'Created' }
  ]

  const orders: Filter[] = [
    { key: 'desc', label: 'Desc', icon: 'i-uil-sort-amount-down' },
    { key: 'asc', label: 'Asc', icon: 'i-uil-sort-amount-up' }
  ]

  // const typesMap: TypeMap = {
  //   official: 'Official',
  //   community: 'Community',
  //   '3rd-party': 'Third Party'
  // }

  // const modulesByVersion: ComputedRef<Module[]> = computed(() => {
  //   return [...modules.value]
  //     .filter((module) => {
  //       if (selectedVersion.value && !(module.tags ?? []).includes(selectedVersion.value.key as string)) {
  //         return false
  //       }

  //       return true
  //     })
  // })

  const categories = computed<Filter[]>(() => {
    return Object.keys(iconsMap)
      .map((category) => {
        const currentCategory = route.query.category?.toString() || ''
        const isSelected = currentCategory.toLowerCase() === category.toLowerCase()

        return {
          key: category,
          title: category,
          exactQuery: true,
          active: isSelected,
          to: {
            name: 'modules',
            query: {
              ...route.query,
              category: isSelected ? undefined : category
            },
            state: { smooth: '#smooth' }
          },
          icon: iconsMap[category as keyof typeof iconsMap] || undefined
        }
      })
      .sort((a, b) => a.title.localeCompare(b.title))
  })

  // const types: ComputedRef<Filter[]> = computed(() => {
  //   return [...new Set(modules.value.map(module => module.type))].map(type => ({
  //     key: type,
  //     label: typesMap[type as keyof typeof typesMap] || type,
  //     to: {
  //       name: 'modules',
  //       query: {
  //         ...route.query,
  //         type
  //       },
  //       state: { smooth: '#smooth' }
  //     }
  //   })).sort((a, b) => {
  //     const typesMappingKeys = Object.keys(typesMap)
  //     const aIndex = typesMappingKeys.indexOf(a.key)
  //     const bIndex = typesMappingKeys.indexOf(b.key)
  //     return aIndex - bIndex
  //   })
  // })

  // const contributors: ComputedRef<Set<string>> = computed(() => {
  //   return new Set(modules.value.flatMap(m => m.contributors.map(m => m.login)))
  // })

  // const stats: ComputedRef<{ downloads: number, contributors: number, modules: number }> = computed(() => {
  //   return {
  //     downloads: modules.value.reduce((sum, m) => sum + m.downloads, 0),
  //     contributors: contributors.value.size,
  //     modules: modules.value.length
  //   }
  // })

  const selectedCategory = computed(() => {
    return categories.value.find(category => category.key === route.query.category)
  })

  // const selectedType: ComputedRef<Filter | null> = computed(() => {
  //   return types.value.find(type => type.key === route.query.type)
  // })

  // const selectedVersion = computed(() => {
  //   return versions.find(version => version.key === route.query.version) || versions[0]
  // })

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

  // const links = computed(() => {
  //   return [
  //     {
  //       label: 'All',
  //       _path: {
  //         name: 'modules',
  //         query: {
  //           ...route.query,
  //           type: undefined
  //         },
  //         state: { smooth: '#smooth' }
  //       },
  //       active: !route.query.type
  //     },
  //     ...types.value.map(type => ({ ...type, _path: type.to, exact: true, active: route.query.type === type.key }))
  //   ]
  // })

  const filteredModules = computed<Module[]>(() => {
    let filteredModules = [...modules.value]
      .filter((module: Module | any) => {
        if (selectedCategory.value && module.category !== selectedCategory.value.key) {
          return false
        }
        // if (selectedType.value && module.type !== selectedType.value.key) {
        //   return false
        // }
        // if (selectedVersion.value && !(module.tags ?? []).includes(selectedVersion.value.key)) {
        //   return false
        // }
        const queryRegExp = searchTextRegExp(q.value as string)
        if (q.value && !['name', 'npm', 'category', 'description', 'repo'].map(field => module[field]).filter(Boolean).some(value => value.search(queryRegExp) !== -1)) {
          return false
        }

        return true
      })
      .sort((a: Module, b: Module) => b.stats[selectedSort.value.key] - a.stats[selectedSort.value.key])

    if (selectedOrder.value.key === 'asc') {
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
    // links
  }
}
