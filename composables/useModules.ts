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

    const data = await $fetch('https://modules.nuxtjs.org/api/modules')

    _modules.value = data.modules

    pending.value = false
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

  const versions = computed(() => ([
    { key: '3.x', label: 'v3' },
    { key: '2.x-bridge', label: 'Bridge' },
    { key: '2.x', label: 'v2' }
  ]))

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

  return {
    // Http
    fetch,
    // Data
    modules,
    versions,
    categories,
    contributors,
    stats
  }
}
