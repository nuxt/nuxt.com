import type { CommandPaletteGroup } from '@nuxt/ui'
import { createSharedComposable } from '@vueuse/core'

function _useHeaderLinks() {
  const route = useRoute()
  const { version } = useDocsVersion()

  const headerLinks = computed(() => {
    const to = version.value.path

    return [{
      label: 'Docs',
      icon: 'i-lucide-book-marked',
      to,
      search: false,
      active: route.path.startsWith(to) || route.path.startsWith(`/deploy`),
      children: [{
        label: 'Get Started',
        description: 'Learn how to get started with Nuxt to build your first app.',
        icon: 'i-lucide-rocket',
        to: `${to}/getting-started/installation`,
        active: route.path.startsWith(`${to}/getting-started`)
      }, {
        label: 'Structure',
        description: 'Learn about the directory structure of a Nuxt project.',
        icon: 'i-lucide-folder-open',
        to: `${to}/directory-structure`,
        active: route.path.startsWith(`${to}/directory-structure`)
      }, {
        label: 'Guide',
        description: 'Get the key concepts, directory structure and best practices.',
        icon: 'i-lucide-book-open',
        to: `${to}/guide`,
        active: route.path.startsWith(`${to}/guide`) && !route.path.startsWith(`${to}/guide/directory-structure`)
      }, {
        label: 'API',
        description: 'Explore the Nuxt components, composables, utilities and more.',
        icon: 'i-lucide-code-xml',
        to: `${to}/api`,
        active: route.path.startsWith(`${to}/api`)
      }, {
        label: 'Deploy',
        description: 'Deploy your Nuxt project anywhere.',
        icon: 'i-lucide-cloud',
        to: '/deploy',
        active: route.path.startsWith('/deploy')
      }, {
        label: 'Examples',
        description: 'Discover and explore official and community examples.',
        icon: 'i-lucide-app-window-mac',
        to: `${to}/examples`,
        active: route.path.startsWith(`${to}/examples`)
      }, {
        label: 'Community',
        description: 'Find answers and support from the community.',
        icon: 'i-lucide-messages-square',
        to: `${to}/community`,
        active: route.path.startsWith(`${to}/community`)
      }]
    }, {
      label: 'Modules',
      icon: 'i-lucide-puzzle',
      to: '/modules',
      description: 'Supercharge your Nuxt project with modules.'
    }, {
      label: 'Templates',
      icon: 'i-lucide-app-window',
      description: 'Start your next project with a Nuxt template.',
      to: '/templates'
    }, {
      label: 'Resources',
      icon: 'i-lucide-library',
      to: '/showcase',
      search: false,
      active: route.path.startsWith('/video-courses') || route.path.startsWith('/showcase'),
      children: [{
        label: 'Showcase',
        description: 'Discover and explore projects built with Nuxt.',
        icon: 'i-lucide-presentation',
        to: '/showcase'
      }, {
        label: 'Video Courses',
        description: 'Learn Nuxt by watching video courses.',
        icon: 'i-lucide-graduation-cap',
        to: '/video-courses'
      }, {
        label: 'Nuxt Certification',
        description: 'Obtain your Certification of Competence.',
        icon: 'i-lucide-medal',
        to: 'https://certification.nuxt.com',
        target: '_blank'
      }]
    }, {
      label: 'Enterprise',
      icon: 'i-lucide-building-2',
      to: '/enterprise',
      search: false,
      children: [{
        label: 'Agencies',
        to: '/enterprise/agencies',
        description: 'Agencies specialized in Nuxt development.',
        icon: 'i-lucide-handshake'
      }, {
        label: 'Sponsors',
        to: '/enterprise/sponsors',
        description: 'Help us sustain Nuxt development.',
        icon: 'i-lucide-hand-heart'
      }]
    }, {
      label: 'Blog',
      icon: 'i-lucide-newspaper',
      to: '/blog'
    }]
  })

  return { headerLinks }
}

export const useHeaderLinks = import.meta.client ? createSharedComposable(_useHeaderLinks) : _useHeaderLinks

const footerLinks = [{
  label: 'Community',
  children: [{
    label: 'Nuxters',
    to: 'https://nuxters.nuxt.com',
    target: '_blank'
  }, {
    label: 'Team',
    to: '/team'
  }, {
    label: 'Design Kit',
    to: '/design-kit'
  }]
}, {
  label: 'Explore',
  children: [{
    label: 'Templates',
    to: 'https://nuxt.com/templates'
  }, {
    label: 'Showcase',
    to: 'https://nuxt.com/showcase'
  }, {
    label: 'AI Evals',
    to: '/evals'
  }]
}, {
  label: 'Enterprise',
  children: [{
    label: 'Agencies',
    to: '/enterprise/agencies'
  }, {
    label: 'Sponsors',
    to: '/enterprise/sponsors'
  }]
}]

export const useFooterLinks = () => ({ footerLinks })

const _useNavigation = () => {
  const nuxtApp = useNuxtApp()
  const searchTerm = ref<string>('')
  const { track } = useAnalytics()

  const { headerLinks } = useHeaderLinks()
  const { footerLinks } = useFooterLinks()
  const { modules } = useModules()
  const { providers } = useHostingProviders()

  const searchLinks = computed(() => [{
    label: 'Ask AI',
    icon: 'i-lucide-wand',
    to: 'javascript:void(0);',
    onSelect: () => {
      track('Ask AI Opened', { source: 'search-links' })
      nuxtApp.$kapa?.openModal()
    }
  }, ...headerLinks.value.map((link) => {
    // Remove `/docs` and `/enterprise` links from command palette
    if (link.search === false) {
      return {
        label: link.label,
        icon: link.icon,
        children: link.children
      }
    }
    return link
  }).filter(Boolean), {
    label: 'Team',
    icon: 'i-lucide-users',
    to: '/team'
  }, {
    label: 'Design Kit',
    icon: 'i-lucide-palette',
    to: '/design-kit'
  }, {
    label: 'Newsletter',
    icon: 'i-lucide-mail',
    to: '/newsletter'
  }, {
    label: 'Source Code',
    icon: 'i-lucide-code',
    to: 'https://github.com/nuxt/nuxt.com',
    target: '_blank'
  }])

  const modulesItems = computed(() => modules.value.map(module => ({
    id: `module-${module.name}`,
    label: module.npm,
    suffix: module.description,
    avatar: {
      src: moduleImage(module.icon),
      ui: {
        root: 'rounded-none bg-transparent'
      }
    },
    to: `/modules/${module.name}`,
    // Store searchable fields for filtering
    _searchFields: [module.name, module.npm, module.repo].filter(Boolean)
  })))

  const hostingItems = computed(() => providers.value.map(hosting => ({
    id: `hosting-${hosting.path}`,
    label: hosting.title,
    suffix: hosting.description,
    icon: hosting.logoIcon,
    avatar: hosting.logoSrc
      ? {
          src: hosting.logoSrc,
          ui: {
            root: 'rounded-none bg-transparent'
          }
        }
      : undefined,
    to: hosting.path,
    // Store searchable fields for filtering
    _searchFields: [hosting.title].filter(Boolean)
  })))

  const searchGroups = computed<CommandPaletteGroup[]>(() => [{
    id: 'ask-ai-search',
    label: 'AI',
    ignoreFilter: true,
    postFilter: (searchTerm: string, items: any[]) => {
      if (!searchTerm) {
        return []
      }
      return items
    },
    items: [{
      label: 'Ask AI',
      icon: 'i-lucide-wand',
      to: 'javascript:void(0);',
      onSelect() {
        track('Ask AI Opened', { source: 'search-palette', query: searchTerm.value })
        nuxtApp.$kapa?.openModal(searchTerm.value)
      }
    }]
  }, {
    id: 'modules-search',
    label: 'Modules',
    items: modulesItems.value
  }, {
    id: 'hosting-search',
    label: 'Hosting',
    items: hostingItems.value
  }])

  watchDebounced(searchTerm, (term) => {
    if (term) {
      track('Search Performed', { term })
    }
  }, { debounce: 500 })

  return {
    searchTerm,
    headerLinks,
    footerLinks,
    searchLinks,
    searchGroups
  }
}

export const useNavigation = import.meta.client ? createSharedComposable(_useNavigation) : _useNavigation
