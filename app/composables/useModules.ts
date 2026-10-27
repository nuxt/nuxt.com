type ModuleStatsKeys = 'version' | 'downloads' | 'stars' | 'publishedAt' | 'createdAt'
import type { Module } from '#shared/types'
import type { Filter } from '~/types'

// `purpose` completes "Discover N Nuxt modules by the community for …" in a category's meta description.
const categoriesMap: Record<string, { icon: string, purpose: string }> = {
  'Official': { icon: 'i-lucide-medal', purpose: '' },
  'AI': { icon: 'i-lucide-brain', purpose: 'adding AI features to your Nuxt application' },
  'Analytics': { icon: 'i-lucide-chart-bar', purpose: 'adding analytics to your Nuxt application' },
  'Animation': { icon: 'i-lucide-sparkles', purpose: 'adding animations to your Nuxt application' },
  'API & Data Fetching': { icon: 'i-lucide-unplug', purpose: 'fetching data and calling APIs in your Nuxt application' },
  'Authentication': { icon: 'i-lucide-key-round', purpose: 'adding authentication to your Nuxt application' },
  'Backend & Database': { icon: 'i-lucide-database', purpose: 'connecting your Nuxt application to a backend or database' },
  'Charts & Maps': { icon: 'i-lucide-chart-pie', purpose: 'displaying charts and maps in your Nuxt application' },
  'CMS & Content': { icon: 'i-lucide-pencil', purpose: 'managing the content of your Nuxt application' },
  'CSS & Theming': { icon: 'i-lucide-palette', purpose: 'styling and theming your Nuxt application' },
  'Deployment': { icon: 'i-lucide-rocket', purpose: 'shipping your Nuxt application safely, with feature flags, hosting platform integrations and skew protection' },
  'Devtools': { icon: 'i-lucide-wrench', purpose: 'improving the developer experience of your Nuxt application' },
  'Ecommerce & Payments': { icon: 'i-lucide-shopping-cart', purpose: 'selling products and accepting payments in your Nuxt application' },
  'Email & Notifications': { icon: 'i-lucide-mail', purpose: 'sending emails and notifications from your Nuxt application' },
  'Forms & Validation': { icon: 'i-lucide-text-cursor-input', purpose: 'building and validating forms in your Nuxt application' },
  'i18n': { icon: 'i-lucide-languages', purpose: 'translating and localizing your Nuxt application' },
  'Icons & Fonts': { icon: 'i-lucide-shapes', purpose: 'adding icons and fonts to your Nuxt application' },
  'Images & Media': { icon: 'i-lucide-image', purpose: 'optimizing images and media in your Nuxt application' },
  'Mobile & Desktop': { icon: 'i-lucide-smartphone', purpose: 'turning your Nuxt application into a mobile or desktop app' },
  'Monitoring & Logging': { icon: 'i-lucide-activity', purpose: 'monitoring and logging your Nuxt application' },
  'Performance': { icon: 'i-lucide-gauge', purpose: 'improving the performance of your Nuxt application' },
  'Realtime': { icon: 'i-lucide-radio', purpose: 'adding realtime features to your Nuxt application' },
  'Security': { icon: 'i-lucide-shield', purpose: 'securing your Nuxt application' },
  'SEO': { icon: 'i-lucide-search', purpose: 'improving the SEO of your Nuxt application' },
  'State Management': { icon: 'i-lucide-layers', purpose: 'managing the state of your Nuxt application' },
  'UI Components': { icon: 'i-lucide-component', purpose: 'adding UI components to your Nuxt application' },
  'UI Frameworks': { icon: 'i-lucide-layout-dashboard', purpose: 'building the interface of your Nuxt application with a UI framework' },
  'Utilities': { icon: 'i-lucide-puzzle', purpose: 'adding utilities to your Nuxt application' },
  'Widgets & Embeds': { icon: 'i-lucide-app-window', purpose: 'embedding widgets in your Nuxt application' }
}

export const moduleImage = function (icon: string = '', _size: number = 80) {
  if (!icon) return

  if (/^https?:\/\//.test(icon)) return icon

  return `https://raw.githubusercontent.com/nuxt/modules/main/icons/${icon}`
  // if (/\.svg$/.test(icon)) return `https://raw.githubusercontent.com/nuxt/modules/main/icons/${icon}`

  // return `https://ipx.nuxt.com/s_${size},f_auto/gh/nuxt/modules/main/icons/${icon}`
}

export const moduleIcon = function (category: string) {
  return categoriesMap[category]?.icon || 'i-lucide-box'
}

/** Title and meta description of the modules listing filtered by `category`. */
export function moduleCategorySeo(category: string, count: number) {
  if (category === 'Official') {
    return { title: 'Official Nuxt modules', description: `Discover ${count} official Nuxt modules, built and maintained by the Nuxt team.` }
  }
  return { title: `Nuxt modules for ${category}`, description: `Discover ${count} Nuxt modules by the community for ${categoriesMap[category]!.purpose}.` }
}

export function moduleMatchesSearch(module: Module, query: RegExp) {
  return [module.name, module.npm, module.category, module.description, module.repo].some(value => typeof value === 'string' && value.search(query) !== -1)
}

/** First provider whose label matches, so searching "cloudinary" finds Nuxt Image. */
export function findModuleProvider(module: Module, query: RegExp) {
  return module.providers?.find(provider => provider.label.search(query) !== -1)
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
  const { openInCursor, openInClaudeCode, openInVSCode } = useIdeDeeplink()

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

  function openVSCode() {
    track('Module Prompt Opened', { module: module().name, ide: 'vscode', source })
    openInVSCode(agentPrompt.value)
  }

  return { installCommand, agentPrompt, copyInstall, copyPrompt, openCursor, openClaude, openVSCode }
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
  const modules = computed<Module[]>(() => data.value.modules || [])

  const module = useState<Module>('module', () => ({} as Module))

  // Data fetching
  async function fetchList() {
    if (modules.value.length) {
      return
    }

    return execute()
  }

  // Filters are local state: `/modules` syncs them with the URL without navigating.
  const q = ref('')
  const category = ref('')
  const sortBy = ref('')
  const orderBy = ref('')

  // Data

  const categories = computed<Filter[]>(() => {
    return Object.keys(categoriesMap)
      .map((name) => {
        return {
          key: name,
          label: name,
          active: category.value === name,
          // Same filters as a click, which only changes the category, for links opened in a new tab.
          to: {
            name: 'modules',
            query: { q: q.value || undefined, category: name === category.value ? undefined : name, sortBy: sortBy.value || undefined, orderBy: orderBy.value || undefined },
            state: { smooth: '#smooth' }
          },
          // Clicks filter in memory, so prefetching each category's `_payload.json` is wasted.
          prefetch: false,
          icon: categoriesMap[name]!.icon,
          onClick: (e: MouseEvent) => {
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
            e.preventDefault()
            category.value = category.value === name ? '' : name
          }
        }
      })
  })

  const selectedCategory = computed(() => {
    return categories.value.find(item => item.key === category.value)
  })

  const selectedSort = computed(() => {
    return sorts.find(sort => sort.key === sortBy.value) || sorts[0]
  })

  const selectedOrder = computed(() => {
    return orders.find(order => order.key === orderBy.value) || orders[0]
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
        if (q.value && !moduleMatchesSearch(module, queryRegExp) && !findModuleProvider(module, queryRegExp)) {
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
    if (!sortBy.value && !orderBy.value) {
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
    q,
    category,
    sortBy,
    orderBy
  }
}
