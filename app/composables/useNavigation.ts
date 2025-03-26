import { createSharedComposable } from '@vueuse/core'

function _useHeaderLinks() {
  const route = useRoute()
  const headerLinks = computed(() => {
    return [{
      label: 'Docs',
      icon: 'i-lucide-book-marked',
      to: '/docs',
      search: false,
      active: route.path.startsWith('/docs'),
      children: [{
        label: 'Get Started',
        description: 'Learn how to get started with Nuxt to build your first app.',
        icon: 'i-lucide-rocket',
        to: '/docs/getting-started',
        active: route.path.startsWith('/docs/getting-started')
      }, {
        label: 'Guide',
        description: 'Get the key concepts, directory structure and best practices.',
        icon: 'i-lucide-book-open',
        to: '/docs/guide',
        active: route.path.startsWith('/docs/guide')
      }, {
        label: 'API',
        description: 'Explore the Nuxt components, composables, utilities and more.',
        icon: 'i-lucide-code-xml',
        to: '/docs/api',
        active: route.path.startsWith('/docs/api')
      }, {
        label: 'Examples',
        description: 'Discover and explore official and community examples.',
        icon: 'i-lucide-app-window-mac',
        to: '/docs/examples',
        active: route.path.startsWith('/docs/examples')
      }, {
        label: 'Community',
        description: 'Find answers and support from the community.',
        icon: 'i-lucide-messages-square',
        to: '/docs/community',
        active: route.path.startsWith('/docs/community')
      }]
    }, {
      label: 'Integrations',
      to: '/modules',
      icon: 'i-lucide-unplug',
      search: false,
      active: route.path.startsWith('/modules') || route.path.startsWith('/deploy'),
      children: [{
        label: 'Modules',
        description: 'Supercharge your Nuxt project with modules.',
        icon: 'i-lucide-puzzle',
        to: '/modules'
      }, {
        label: 'Hosting',
        description: 'Deploy your Nuxt project anywhere.',
        icon: 'i-lucide-rocket',
        to: '/deploy'
      }]
    }, {
      label: 'Resources',
      icon: 'i-lucide-library',
      to: '/templates',
      search: false,
      active: route.path.startsWith('/templates') || route.path.startsWith('/video-courses') || route.path.startsWith('/showcase'),
      children: [{
        label: 'Templates',
        icon: 'i-lucide-app-window',
        description: 'Start your next project with a Nuxt template.',
        to: '/templates'
      }, {
        label: 'Video Courses',
        description: 'Learn Nuxt by watching video courses.',
        icon: 'i-lucide-graduation-cap',
        to: '/video-courses'
      }, {
        label: 'Showcase',
        description: 'Discover and explore projects built with Nuxt.',
        icon: 'i-lucide-presentation',
        to: '/showcase'
      }, {
        label: 'Nuxt Certification',
        description: 'Obtain your Certification of Competence.',
        icon: 'i-lucide-medal',
        to: 'https://certification.nuxt.com',
        target: '_blank'
      }]
    }, {
      label: 'Products',
      icon: 'i-lucide-sparkle',
      search: false,
      children: [{
        label: 'Nuxt UI Pro',
        to: 'https://ui.nuxt.com/pro?utm_source=nuxt-website&utm_medium=header',
        description: 'Build faster with premium components for Vue or Nuxt.',
        icon: 'i-lucide-panels-top-left',
        target: '_blank'
      }, {
        label: 'Nuxt Studio',
        to: 'https://content.nuxt.com/studio/?utm_source=nuxt-website&utm_medium=header',
        description: 'Edit your Nuxt Content website with a visual editor.',
        icon: 'i-lucide-pen',
        target: '_blank'
      }, {
        label: 'NuxtHub',
        to: 'https://hub.nuxt.com/?utm_source=nuxt-website&utm_medium=header',
        description: 'Deploy & manage full-stack Nuxt apps that scale.',
        icon: 'i-lucide-rocket',
        target: '_blank'
      }]
    }, {
      label: 'Enterprise',
      icon: 'i-lucide-building-2',
      to: '/enterprise',
      search: false,
      children: [{
        label: 'Support',
        to: '/enterprise/support',
        description: 'Professional support by Nuxt experts.',
        icon: 'i-lucide-life-buoy'
      }, {
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
  label: 'Products',
  children: [{
    label: 'Nuxt UI Pro',
    to: 'https://ui.nuxt.com/pro?utm_source=nuxt-website&utm_medium=footer',
    target: '_blank'
  }, {
    label: 'Nuxt Studio',
    to: 'https://content.nuxt.com/studio/?utm_source=nuxt-website&utm_medium=footer',
    target: '_blank'
  }, {
    label: 'NuxtHub',
    to: 'https://hub.nuxt.com/?utm_source=nuxt-website&utm_medium=footer',
    target: '_blank'
  }]
}, {
  label: 'Enterprise',
  children: [{
    label: 'Support',
    to: '/enterprise/support'
  }, {
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

  const { headerLinks } = useHeaderLinks()
  const { footerLinks } = useFooterLinks()

  const searchLinks = computed(() => [
    {
      label: 'Ask AI',
      icon: 'i-lucide-wand',
      to: 'javascript:void(0);',
      onSelect: () => nuxtApp.$kapa?.openModal()
    },
    ...headerLinks.value.map((link) => {
      // Remove `/docs` and `/enterprise` links from command palette
      if (link.search === false) {
        return {
          label: link.label,
          icon: link.icon,
          children: link.children
        }
      }
      return link
    }).filter((link): link is NonNullable<typeof link> => Boolean(link)), {
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
    }])

  type SearchGroup = {
    id: string
    label: string
    icon?: string
    items: Array<{
      id: string
      label: string
      suffix?: string
      icon?: string
      avatar?: {
        src?: string
        ui?: {
          root: string
        }
      }
      to: string
      onSelect?: () => Promise<void>
    }>
  }

  const searchGroups = computed<SearchGroup[]>(() => {
    const aiGroup: SearchGroup = {
      id: 'ask-ai-search',
      label: 'AI',
      icon: 'i-lucide-wand',
      items: []
    }

    const modulesGroup: SearchGroup = {
      id: 'modules-search',
      label: 'Modules',
      items: []
    }

    const hostingGroup: SearchGroup = {
      id: 'hosting-search',
      label: 'Hosting',
      items: []
    }

    const groups = [aiGroup, modulesGroup, hostingGroup]

    if (!searchTerm.value) {
      return groups
    }

    aiGroup.items = [{
      id: `ask-ai-${searchTerm.value}`,
      label: `Ask AI about "${searchTerm.value}"`,
      icon: 'i-lucide-wand',
      to: 'javascript:void(0);',
      onSelect() {
        return nuxtApp.$kapa.openModal(searchTerm.value)
      }
    }]

    const loadModules = async () => {
      const { modules, fetchList } = useModules()
      if (!modules.value.length) {
        await fetchList()
      }

      modulesGroup.items = modules.value
        .filter(module => ['name', 'npm', 'repo'].map(field => module[field as keyof typeof module]).filter(Boolean).some(value => typeof value === 'string' && value.search(searchTextRegExp(searchTerm.value)) !== -1))
        .map(module => ({
          id: `module-${module.name}`,
          label: module.npm,
          suffix: module.description,
          avatar: {
            src: moduleImage(module.icon),
            ui: {
              root: 'rounded-none bg-transparent'
            }
          },
          to: `/modules/${module.name}`
        }))
    }

    const loadHosting = async () => {
      const { providers, fetchList } = useHostingProviders()
      if (!providers.value.length) {
        await fetchList()
      }

      hostingGroup.items = providers.value
        .filter(hosting => ['title'].map(field => hosting[field as keyof typeof hosting]).filter(Boolean).some(value => typeof value === 'string' && value.search(searchTextRegExp(searchTerm.value)) !== -1))
        .map(hosting => ({
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
          to: hosting.path
        }))
    }

    onMounted(() => {
      Promise.all([
        loadModules(),
        loadHosting()
      ]).catch(error => console.error('Error loading search results:', error))
    })

    return groups
  })

  return {
    searchTerm,
    headerLinks,
    footerLinks,
    searchLinks,
    searchGroups
  }
}

export const useNavigation = import.meta.client ? createSharedComposable(_useNavigation) : _useNavigation
