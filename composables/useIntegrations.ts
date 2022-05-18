import type { Ref } from 'vue'

export const useIntegrations = () => {
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
      const data = await $fetch('https://modules.nuxtjs.org/api/modules')

      _modules.value = data.modules
    } catch (e) {
      _modules.value = []
    }

    pending.value = false
  }

  // Data

  const versions = ref([
    { key: '3.x', label: 'v3' },
    { key: '2.x-bridge', label: 'Bridge' },
    { key: '2.x', label: 'v2' }
  ])

  const sorts = ref([
    { key: 'downloads', label: 'Downloads' },
    { key: 'stars', label: 'Stars' },
    { key: 'publishedAt', label: 'Updated' },
    { key: 'createdAt', label: 'Created' }
  ])

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

  const categories = computed(() => {
    return [...new Set(modules.value.map(module => module.category))].map(category => ({
      key: category,
      title: category,
      to: {
        name: 'integrations',
        query: {
          ...route.query,
          category: route.query?.category !== category ? category : undefined
        },
        params: { smooth: '#smooth' }
      }
    }))
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

  const selectedVersion = computed(() => {
    return versions.value.find(version => version.key === route.query.version) || versions.value[0]
  })

  const selectedSort = computed(() => {
    return sorts.value.find(version => version.key === route.query.sortBy) || sorts.value[0]
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
    // Computed
    modules,
    categories,
    contributors,
    stats,
    selectedCategory,
    selectedVersion,
    selectedSort,
    q
  }
}
