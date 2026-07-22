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

export type ModulePromptInfo = Pick<Module, 'name' | 'npm' | 'description' | 'website' | 'repo'>

export function buildModuleInstallCommand(names: string | string[]): string {
  const moduleNames = Array.isArray(names) ? names.join(' ') : names
  return `npx nuxt@latest module add ${moduleNames}`
}

export function buildModuleAgentPrompt(module: ModulePromptInfo): string {
  const lines = [`Install and configure the Nuxt module ${module.npm || module.name}: ${module.description || ''}`]
  if (module.website) lines.push(`Docs: ${module.website}`)
  if (module.repo) lines.push(`GitHub: https://github.com/${module.repo}`)
  // Avoid the literal `.env` string: Cursor's deeplink handler rejects prompts matching /\.env(\b|\W)/ with "Invalid text for prompt".
  lines.push(`\nSteps:\n1. Run \`${buildModuleInstallCommand(module.name)}\`\n2. Read the module documentation and add recommended configuration in \`nuxt.config.ts\`\n3. List any required environment variables in the example env file without filling in actual values`)
  return lines.join('\n')
}

export function buildBulkModuleAgentPrompt(modules: ModulePromptInfo[]): string {
  const modulesList = modules.map((m) => {
    const lines = [`- ${m.npm || m.name}: ${m.description || ''}`]
    if (m.website) lines.push(`  Docs: ${m.website}`)
    if (m.repo) lines.push(`  GitHub: https://github.com/${m.repo}`)
    return lines.join('\n')
  }).join('\n')
  const moduleNames = modules.map(m => m.name)

  return `Install and configure the following Nuxt modules in my project:

${modulesList}

Steps:
1. Run \`${buildModuleInstallCommand(moduleNames)}\` to install all modules at once
2. For each module, read its documentation and add the recommended configuration in \`nuxt.config.ts\`
3. List any required environment variables in the example env file without filling in actual values
4. Verify the setup is correct by checking that the modules are properly registered`
}

/** Shared copy/open actions for a single module's install command & agent prompt, tagged with an analytics `source`. */
export function useModuleInstallActions(module: () => ModulePromptInfo, source: string) {
  const { copy } = useClipboard()
  const { track } = useAnalytics()
  const { openInCursor, openInClaudeCode } = useIdeDeeplink()

  const installCommand = computed(() => buildModuleInstallCommand(module().name))
  const agentPrompt = computed(() => buildModuleAgentPrompt(module()))

  function copyInstall() {
    track('Module Install Command Copied', { module: module().name, source })
    copy(installCommand.value, { title: 'Command copied to clipboard:', description: installCommand.value })
  }

  function copyPrompt() {
    track('Module Agent Prompt Copied', { module: module().name, source })
    copy(agentPrompt.value, {
      title: 'Agent prompt copied!',
      description: module().npm || module().name,
      icon: 'i-custom-ai'
    })
  }

  function openCursor() {
    track('Module Prompt Opened', { module: module().name, ide: 'cursor', source })
    openInCursor(agentPrompt.value)
  }

  function openClaude() {
    track('Module Prompt Opened', { module: module().name, ide: 'claude', source })
    openInClaudeCode(agentPrompt.value)
  }

  return { installCommand, agentPrompt, copyInstall, copyPrompt, openCursor, openClaude }
}

export const sorts: Filter[] = [
  { key: 'downloads', label: 'Downloads' },
  { key: 'stars', label: 'Stars' },
  { key: 'publishedAt', label: 'Updated' },
  { key: 'createdAt', label: 'Created' }
]

const orders: Filter[] = [
  { key: 'desc', label: 'Desc', icon: 'i-lucide-arrow-down-wide-narrow' },
  { key: 'asc', label: 'Asc', icon: 'i-lucide-arrow-up-wide-narrow' }
]

export const useModules = () => {
  const route = useRoute()
  const router = useRouter()
  const { data, execute } = useFetch('/api/v1/modules', {
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
