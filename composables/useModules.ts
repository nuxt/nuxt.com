import type { Module, Filter } from '../types'

const iconsMap = {
  Analytics: 'i-ph-chart-bar-duotone',
  CMS: 'i-ph-pencil-duotone',
  CSS: 'i-ph-paint-brush-broad-duotone',
  Database: 'i-ph-database-duotone',
  Devtools: 'i-ph-wrench-duotone',
  Ecommerce: 'i-ph-shopping-cart-duotone',
  Extensions: 'i-ph-puzzle-piece-duotone',
  Fonts: 'i-ph-text-aa-duotone',
  Images: 'i-ph-image-duotone',
  Libraries: 'i-ph-books-duotone',
  Monitoring: 'i-ph-timer-duotone',
  Payment: 'i-ph-credit-card-duotone',
  Performance: 'i-ph-gauge-duotone',
  Request: 'i-ph-plugs-connected-duotone',
  Security: 'i-ph-shield-duotone',
  SEO: 'i-ph-file-search-duotone',
  UI: 'i-ph-layout-duotone'
}

export const moduleImage = function (icon: string = '', size: number = 80) {
  if (!icon) return

  if (/^http(s)?:\/\//.test(icon)) return icon

  if (/\.svg$/.test(icon)) return `https://raw.githubusercontent.com/nuxt/modules/main/icons/${icon}`

  return `https://ipx.nuxt.com/s_${size},f_auto/gh/nuxt/modules/main/icons/${icon}`
}

export const moduleIcon = function (category: string) {
  return iconsMap[category as keyof typeof iconsMap] || 'i-ph-cube-duotone'
}

export const useModules = () => {
  // interface TypeMap {
  //   official: string,
  //   community: string
  //   '3rd-party': string
  // }

  const route = useRoute()
  const router = useRouter()
  const loadingIndicator = useLoadingIndicator()

  const modules = useState<Module[]>('modules', () => [])
  const module = useState<Module>('module', () => ({} as Module))



  // Data fetching

  async function fetchList () {
    if (modules.value.length) {
      return
    }

    const res = await $fetch<{ modules: Module[] }>('https://api.nuxt.com/modules')
    if (res?.modules) {
      modules.value = res.modules
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

  watch(() => route.query, () => {
    loadingIndicator.finish()
  })

  const categories = computed<Filter[]>(() => {
    return Object.keys(iconsMap).map(category => ({
      key: category,
      label: category,
      exactQuery: true,
      to: {
        name: 'modules',
        query: {
          ...route.query,
          category
        },
        state: { smooth: '#smooth' }
      },
      icon: iconsMap[category as keyof typeof iconsMap] || undefined,
      click: (e) => {
        if (route.query.category !== category) {
          return
        }

        e.preventDefault()

        router.replace({ query: { ...route.query, category: undefined } })
      }
    })).sort((a, b) => {
      return a.label.localeCompare(b.label)
    })
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
      .sort((a: any, b: any) => b.stats[selectedSort.value.key] - a.stats[selectedSort.value.key])

    if (selectedOrder.value.key === 'asc') {
      filteredModules = filteredModules.reverse()
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
