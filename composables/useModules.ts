import type { Ref } from 'vue'

export const useModules = () => {
  const route = useRoute()
  const _modules: Ref<object[]> = useState('modules', () => [])

  const pending = ref(false)

  // Http

  async function fetch () {
    if (_modules.value.length) {
      return
    }

    pending.value = true

    try {
      const data = await $fetch('/api/modules')

      _modules.value = data.modules
    } catch (e) {
      _modules.value = []
    }

    pending.value = false
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
    { key: 'desc', label: 'Desc', icon: 'heroicons-outline:sort-descending' },
    { key: 'asc', label: 'Asc', icon: 'heroicons-outline:sort-ascending' }
  ]

  const typesMapping = {
    official: 'Official',
    community: 'Community',
    '3rd-party': 'Third Party'
  }

  // Computed

  const modules = computed(() => {
    return _modules.value.map((module) => {
      const compatibilityTags = []
      if (module.compatibility.nuxt.includes('^2.0.0')) {
        if (module.compatibility.requires.bridge !== true /* bridge: false or bridge: optional */) {
          compatibilityTags.push('2.x')
        }
        if (module.compatibility.requires.bridge) {
          compatibilityTags.push('2.x-bridge')
        }
      }
      if (module.compatibility.nuxt.includes('^3.0.0')) {
        compatibilityTags.push('3.x')
      }

      return {
        ...module,
        tags: [
          ...(module.tags || []),
          ...compatibilityTags
        ]
      }
    })
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

  const categories = computed(() => {
    return [...new Set(modulesByVersion.value.map(module => module.category))].map(category => ({
      key: category,
      title: category,
      to: {
        name: 'modules',
        query: {
          ...route.query,
          category: route.query?.category !== category ? category : undefined
        },
        params: { smooth: '#smooth' }
      }
    })).sort((a, b) => {
      return a.title.localeCompare(b.title)
    })
  })

  const types = computed(() => {
    return [...new Set(modulesByVersion.value.map(module => module.type))].map(type => ({
      key: type,
      title: typesMapping[type] || type,
      to: {
        name: 'modules',
        query: {
          ...route.query,
          type
        },
        params: { smooth: '#smooth' }
      }
    })).sort((a, b) => {
      const typesMappingKeys = Object.keys(typesMapping)
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
    return route.query.q
  })

  return {
    // Http
    fetch,
    // Data
    versions,
    sorts,
    orders,
    // Computed
    modules,
    categories,
    types,
    contributors,
    stats,
    selectedCategory,
    selectedType,
    selectedVersion,
    selectedSort,
    selectedOrder,
    q
  }
}
