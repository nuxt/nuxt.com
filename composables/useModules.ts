import type { Ref, ComputedRef } from 'vue'
import type { Module, FilterItem } from '../types'

export const useModules = () => {
  interface TypeMap {
    official: string,
    community: string
    '3rd-party': string
  }

  const route = useRoute()
  const modules: Ref<Module[]> = useState('modules', () => [])
  const module: Ref<Module> = useState('module', () => ({} as Module))

  const iconsMap = {
    Analytics: 'i-uil-chart-line',
    CMS: 'i-uil-pen',
    CSS: 'i-uil-brush-alt',
    Database: 'i-uil-database',
    Date: 'i-uil-calendar-alt',
    Deployment: 'i-uil-cloud',
    Devtools: 'i-uil-wrench',
    Ecommerce: 'i-uil-shopping-basket',
    Extensions: 'i-uil-puzzle-piece',
    Fonts: 'i-uil-font',
    Images: 'i-uil-image-v',
    Libraries: 'i-uil-books',
    Monitoring: 'i-uil-stopwatch',
    Payment: 'i-uil-dollar-alt',
    Performance: 'i-uil-rocket',
    Request: 'i-uil-life-ring',
    Security: 'i-uil-shield',
    SEO: 'i-uil-search-alt',
    UI: 'i-uil-palette'
  }

  // Data fetching
  async function fetchList () {
    if (modules.value.length) return modules.value

    const res = await $fetch<{ modules: Module[] }>('https://api.nuxt.com/modules')
    if (res?.modules) {
      modules.value = res.modules
    }
  }

  async function fetchOne (name: string) {
    if (module.value.name === name) {
      return
    }

    const m = modules.value.find(m => m.name === name)
    if (m) {
      module.value = m
      return
    }

    try {
      module.value = await $fetch<Module>(`https://api.nuxt.com/modules/${name}`)
    } catch (e) {
      throw createError({ statusMessage: 'Module not found', message: 'This page does not exist.', statusCode: 404 })
    }
  }

  // Data

  const versions: FilterItem[] = [
    { key: '3.x', label: 'v3' },
    { key: '2.x-bridge', label: 'Bridge' },
    { key: '2.x', label: 'v2' }
  ]

  const sorts: FilterItem[] = [
    { key: 'downloads', label: 'Downloads' },
    { key: 'stars', label: 'Stars' },
    { key: 'publishedAt', label: 'Updated' },
    { key: 'createdAt', label: 'Created' }
  ]

  const orders: FilterItem[] = [
    { key: 'desc', label: 'Desc', icon: 'uil:sort-amount-down' },
    { key: 'asc', label: 'Asc', icon: 'uil:sort-amount-up' }
  ]

  const typesMap: TypeMap = {
    official: 'Official',
    community: 'Community',
    '3rd-party': 'Third Party'
  }

  const githubQuery: ComputedRef<{ owner: string, repo: string }> = computed(() => {
    const [ownerAndRepo] = module.value.repo.split('#')
    const [owner, repo] = ownerAndRepo.split('/')
    return {
      owner,
      repo
    }
  })

  const modulesByVersion: ComputedRef<Module[]> = computed(() => {
    return [...modules.value]
      .filter((module) => {
        // FIXME
        // if (selectedVersion.value && !(module.tags ?? []).includes(selectedVersion.value.key as string)) {
        //   return false
        // }

        return true
      })
  })

  const categories: ComputedRef<FilterItem[] | []> = computed(() => {
    return [...new Set(modulesByVersion.value.map(module => module.category))].map(category => ({
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
      icon: iconsMap[category as keyof typeof iconsMap] || undefined
    })).sort((a, b) => {
      return a.label.localeCompare(b.label)
    })
  })

  const types: ComputedRef<FilterItem[]> = computed(() => {
    return [...new Set(modulesByVersion.value.map(module => module.type))].map(type => ({
      key: type,
      label: typesMap[type as keyof typeof typesMap] || type,
      to: {
        name: 'modules',
        query: {
          ...route.query,
          type
        },
        state: { smooth: '#smooth' }
      }
    })).sort((a, b) => {
      const typesMappingKeys = Object.keys(typesMap)
      const aIndex = typesMappingKeys.indexOf(a.key)
      const bIndex = typesMappingKeys.indexOf(b.key)
      return aIndex - bIndex
    })
  })

  const contributors: ComputedRef<Set<string>> = computed(() => {
    return new Set(modules.value.flatMap(m => m.contributors.map(m => m.login)))
  })

  const stats: ComputedRef<{ downloads: number, contributors: number, modules: number }> = computed(() => {
    return {
      downloads: modules.value.reduce((sum, m) => sum + m.downloads, 0),
      contributors: contributors.value.size,
      modules: modules.value.length
    }
  })

  const selectedCategory: ComputedRef<FilterItem | null> = computed(() => {
    return categories.value.find(category => category.key === route.query.category) || null
  })

  const selectedType: ComputedRef<FilterItem | null> = computed(() => {
    return types.value.find(type => type.key === route.query.type) || null
  })

  const selectedVersion: ComputedRef<FilterItem> = computed(() => {
    return versions.find(version => version.key === route.query.version) || versions[0]
  })

  const selectedSort: ComputedRef<FilterItem> = computed(() => {
    return sorts.find(sort => sort.key === route.query.sortBy) || sorts[0]
  })

  const selectedOrder: ComputedRef<FilterItem> = computed(() => {
    return orders.find(order => order.key === route.query.orderBy) || orders[0]
  })

  const q: ComputedRef<string> = computed(() => {
    return route.query.q as string
  })

  const links: ComputedRef<any[]> = computed(() => {
    return [
      {
        label: 'All',
        _path: {
          name: 'modules',
          query: {
            ...route.query,
            type: undefined
          },
          state: { smooth: '#smooth' }
        },
        active: !route.query.type
      },
      ...types.value.map(type => ({ ...type, _path: type.to, exact: true, active: route.query.type === type.key }))
    ]
  })

  const filteredModules: ComputedRef<Module[]> = computed(() => {
    let filteredModules = [...modules.value]
      .filter((module: Module | any) => {
        if (selectedCategory.value && module.category !== selectedCategory.value.key) {
          return false
        }
        if (selectedType.value && module.type !== selectedType.value.key) {
          return false
        }
        // FIXME
        // if (selectedVersion.value && !(module.tags ?? []).includes(selectedVersion.value.key)) {
        //   return false
        // }
        const queryRegExp = searchTextRegExp(q.value as string)
        if (q.value && !['name', 'npm', 'category', 'description', 'repo'].map(field => module[field]).filter(Boolean).some(value => value.search(queryRegExp) !== -1)) {
          return false
        }

        return true
      })
      .sort((a: any, b: any) => b[selectedSort.value.key] - a[selectedSort.value.key])

    if (selectedOrder.value.key === 'asc') {
      filteredModules = filteredModules.reverse()
    }

    return filteredModules
  })

  return {
    // Data fetching
    fetchList,
    fetchOne,
    // Data
    versions,
    sorts,
    orders,
    // Computed
    modules,
    filteredModules,
    module,
    githubQuery,
    categories,
    types,
    contributors,
    stats,
    selectedCategory,
    selectedType,
    selectedVersion,
    selectedSort,
    selectedOrder,
    q,
    links
  }
}
