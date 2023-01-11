import type { Ref, ComputedRef } from 'vue'
import type { Module, Category } from '../types'

export const useModules = () => {
  const route = useRoute()
  const modules: Ref<Module[]> = useState('modules', () => [])
  const module: Ref<Module> = useState('module', () => ({} as Module))

  const iconsMap = {
    Analytics: 'uil-chart-line',
    CMS: 'uil-pen',
    CSS: 'uil-brush-alt',
    Database: 'uil-database',
    Date: 'uil-calendar-alt',
    Deployment: 'uil-cloud',
    Devtools: 'uil-wrench',
    Ecommerce: 'uil-shopping-basket',
    Extensions: 'uil-puzzle-piece',
    Fonts: 'uil-font',
    Images: 'uil-image-v',
    Libraries: 'uil-books',
    Monitoring: 'uil-stopwatch',
    Payment: 'uil-dollar-alt',
    Performance: 'uil-rocket',
    Request: 'uil-life-ring',
    Security: 'uil-shield',
    SEO: 'uil-search-alt',
    UI: 'uil-palette'
  }

  // Data fetching
  async function fetchList () {
    const { data, error } = await useFetch<{ modules: Module[] }>('/api/modules.json')

    /* Missing data is handled at component level */
    if (!data.value && error.value) {
      return error.value
    }

    if (data) {
      modules.value = data.value?.modules || []
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
      module.value = await $fetch<Module>(`/api/modules/${name}`)
    } catch (e) {
      throw createError({ statusMessage: 'Module not found', message: 'This page does not exist.', statusCode: 404 })
    }
  }

  // Data

  const versions = [
    { key: '3.x', label: 'v3' },
    { key: '2.x-bridge', label: 'Bridge' },
    { key: '2.x', label: 'v2' }
  ]

  const sorts = [
    { key: 'downloads', label: 'Downloads' },
    { key: 'stars', label: 'Stars' },
    { key: 'publishedAt', label: 'Updated' },
    { key: 'createdAt', label: 'Created' }
  ]

  const orders = [
    { key: 'desc', label: 'Desc', icon: 'uil:sort-amount-down' },
    { key: 'asc', label: 'Asc', icon: 'uil:sort-amount-up' }
  ]

  const typesMap = {
    official: 'Official',
    community: 'Community',
    '3rd-party': 'Third Party'
  }

  const githubQuery = computed(() => {
    const [ownerAndRepo] = module.value.repo.split('#')
    const [owner, repo] = ownerAndRepo.split('/')
    return {
      owner,
      repo
    }
  })

  const modulesByVersion = computed(() => {
    return [...modules.value]
      .filter((module) => {
        if (selectedVersion.value && !module.tags.includes(selectedVersion.value.key)) {
          return false
        }

        return true
      })
  })

  const categories: ComputedRef<Category[] | []> = computed(() => {
    return [...new Set(modulesByVersion.value.map(module => module.category))].map(category => ({
      key: category,
      title: category,
      to: {
        name: 'modules',
        query: {
          ...route.query,
          category: route.query?.category !== category ? category : undefined
        },
        state: { smooth: '#smooth' }
      },
      icon: iconsMap[category as keyof typeof iconsMap]
    })).sort((a, b) => {
      return a.title.localeCompare(b.title)
    })
  })

  const types = computed(() => {
    return [...new Set(modulesByVersion.value.map(module => module.type))].map(type => ({
      key: type,
      title: typesMap[type as keyof typeof typesMap] || type,
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

  const contributors = computed(() => {
    return new Set(modules.value.flatMap(m => m.contributors.map(m => m.login)))
  })

  const stats = computed(() => {
    return {
      downloads: modules.value.reduce((sum, m) => sum + m.downloads, 0),
      contributors: contributors.value.size,
      modules: modules.value.length
    }
  })

  const selectedCategory = computed(() => {
    return categories.value.find(category => category.key === route.query.category)
  })

  const selectedType = computed(() => {
    return types.value.find(type => type.key === route.query.type)
  })

  const selectedVersion = computed(() => {
    return versions.find(version => version.key === route.query.version) || versions[0]
  })

  const selectedSort = computed(() => {
    return sorts.find(sort => sort.key === route.query.sortBy) || sorts[0]
  })

  const selectedOrder = computed(() => {
    return orders.find(order => order.key === route.query.orderBy) || orders[0]
  })

  const q = computed(() => {
    return route.query.q as string
  })

  const links = computed(() => {
    return [
      {
        title: 'All',
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

  const filteredModules = computed(() => {
    let filteredModules = [...modules.value]
      .filter((module) => {
        if (selectedCategory.value && module.category !== selectedCategory.value.key) {
          return false
        }
        if (selectedType.value && module.type !== selectedType.value.key) {
          return false
        }
        if (selectedVersion.value && !module.tags.includes(selectedVersion.value.key)) {
          return false
        }
        const queryRegExp = searchTextRegExp(q.value as string)
        if (q.value && !['name', 'npm', 'category', 'description', 'repo'].map(field => module[field]).filter(Boolean).some(value => value.search(queryRegExp) !== -1)) {
          return false
        }

        return true
      })
      .sort((a, b) => b[selectedSort.value.key] - a[selectedSort.value.key])

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
