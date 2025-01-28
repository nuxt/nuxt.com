import { createSharedComposable } from '@vueuse/core'

const _useNavigation = () => {
  const nuxtApp = useNuxtApp()
  const headerLinks = computed(() => {
    const route = useRoute()

    return [{
      label: 'Docs',
      icon: 'i-ph-book-bookmark',
      to: '/docs',
      search: false,
      children: [{
        label: 'Get Started',
        description: 'Learn how to get started with Nuxt.',
        icon: 'i-ph-rocket-launch',
        to: '/docs/getting-started',
        active: route.path.startsWith('/docs/getting-started')
      }, {
        label: 'Guide',
        description: 'Learn how to build and deploy Nuxt applications.',
        icon: 'i-ph-book-open',
        to: '/docs/guide',
        active: route.path.startsWith('/docs/guide')
      }, {
        label: 'API',
        description: 'Explore the Nuxt API.',
        icon: 'i-ph-code',
        to: '/docs/api',
        active: route.path.startsWith('/docs/api')
      }, {
        label: 'Examples',
        description: 'Discover and explore official and community examples.',
        icon: 'i-ph-app-window',
        to: '/docs/examples',
        active: route.path.startsWith('/docs/examples')
      }, {
        label: 'Community',
        description: 'Find answers and support from the community.',
        icon: 'i-ph-chats-teardrop',
        to: '/docs/community',
        active: route.path.startsWith('/docs/community')
      }]
    }, {
      label: 'Integrations',
      to: '/modules',
      icon: 'i-ph-plugs-connected',
      search: false,
      active: route.path.startsWith('/modules') || route.path.startsWith('/deploy'),
      children: [{
        label: 'Modules',
        description: 'Supercharge your Nuxt project with modules.',
        icon: 'i-ph-puzzle-piece',
        to: '/modules'
      }, {
        label: 'Hosting',
        description: 'Deploy your Nuxt project anywhere.',
        icon: 'i-ph-rocket-launch',
        to: '/deploy'
      }]
    }, {
      label: 'Resources',
      icon: 'i-ph-books',
      to: '/templates',
      search: false,
      active: route.path.startsWith('/templates') || route.path.startsWith('/video-courses'),
      children: [{
        label: 'Templates',
        icon: 'i-ph-browsers',
        description: 'Start your next project with a Nuxt template.',
        to: '/templates'
      }, {
        label: 'Video Courses',
        description: 'Learn Nuxt by watching video courses.',
        icon: 'i-ph-graduation-cap',
        to: '/video-courses'
      }, {
        label: 'Showcase',
        description: 'Discover and explore projects built with Nuxt.',
        icon: 'i-ph-projector-screen',
        to: '/showcase'
      }, {
        label: 'Nuxt Certification',
        description: 'Obtain your Certification of Competence.',
        icon: 'i-ph-medal',
        to: 'https://certification.nuxt.com',
        target: '_blank'
      }]
    }, {
      label: 'Products',
      icon: 'i-ph-sparkle',
      search: false,
      children: [{
        label: 'Nuxt UI Pro',
        to: 'https://ui.nuxt.com/pro?utm_source=nuxt-website&utm_medium=header',
        description: 'Premium Vue components for Nuxt.',
        icon: 'i-ph-layout',
        target: '_blank'
      }, {
        label: 'Nuxt Studio',
        to: 'https://content.nuxt.com/studio/?utm_source=nuxt-website&utm_medium=header',
        description: 'The Git-based CMS for Nuxt.',
        icon: 'i-ph-pen',
        target: '_blank'
      }, {
        label: 'NuxtHub',
        to: 'https://hub.nuxt.com/?utm_source=nuxt-website&utm_medium=header',
        description: 'Build, deploy & manage Nuxt apps that scale.',
        icon: 'i-ph-rocket-launch',
        target: '_blank'
      }]
    }, {
      label: 'Enterprise',
      icon: 'i-ph-buildings',
      to: '/enterprise',
      search: false,
      children: [{
        label: 'Support',
        to: '/enterprise/support',
        description: 'Professional support by Nuxt experts.',
        icon: 'i-ph-lifebuoy'
      }, {
        label: 'Agencies',
        to: '/enterprise/agencies',
        description: 'Agencies specialized in Nuxt development.',
        icon: 'i-ph-handshake'
      }, {
        label: 'Sponsors',
        to: '/enterprise/sponsors',
        description: 'Help us sustain Nuxt development.',
        icon: 'i-ph-hand-heart'
      }]
    }, {
      label: 'Blog',
      icon: 'i-ph-newspaper',
      to: '/blog'
    }]
  })

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

  const searchLinks = computed(() => [
    {
      label: 'Ask AI',
      icon: 'i-ph-magic-wand',
      to: 'javascript:void(0);',
      // @ts-expect-error this is not typed
      click: () => nuxtApp.$kapa?.openModal()
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
    }).filter(Boolean), {
      label: 'Team',
      icon: 'i-ph-users',
      to: '/team'
    }, {
      label: 'Design Kit',
      icon: 'i-ph-palette',
      to: '/design-kit'
    }, {
      label: 'Newsletter',
      icon: 'i-ph-envelope-simple',
      to: '/newsletter'
    }])

  const searchGroups = [{
    key: 'ask-ai-search',
    label: 'AI',
    icon: 'i-ph-magic-wand',
    search: async (q) => {
      if (!q) {
        return []
      }

      return [{
        label: `Ask AI about "${q}"`,
        icon: 'i-ph-magic-wand',
        to: 'javascript:void(0);',
        click() {
          return nuxtApp.$kapa.openModal(q)
        }
      }]
    }
  }, {
    key: 'modules-search',
    label: 'Modules',
    search: async (q) => {
      if (!q) {
        return []
      }

      const { modules, fetchList } = useModules()
      if (!modules.value.length) {
        await fetchList()
      }

      return modules.value
        .filter(module => ['name', 'npm', 'repo'].map(field => module[field]).filter(Boolean).some(value => value.search(searchTextRegExp(q)) !== -1))
        .map(module => ({
          id: `module-${module.name}`,
          label: module.npm,
          suffix: module.description,
          avatar: {
            src: moduleImage(module.icon),
            ui: {
              rounded: 'rounded-md'
            }
          },
          to: `/modules/${module.name}`
        }))
    }
  }, {
    key: 'hosting-search',
    label: 'Hosting',
    search: async (q) => {
      if (!q) {
        return []
      }

      const { providers, fetchList } = useHostingProviders()
      if (!providers.value.length) {
        await fetchList()
      }

      return providers.value
        .filter(hosting => ['title'].map(field => hosting[field]).filter(Boolean).some(value => value.search(searchTextRegExp(q)) !== -1))
        .map(hosting => ({
          id: `hosting-${hosting._path}`,
          label: hosting.title,
          suffix: hosting.description,
          icon: hosting.logoIcon,
          avatar: hosting.logoSrc
            ? {
                src: hosting.logoSrc
              }
            : undefined,
          to: hosting._path
        }))
    }
  }, {
    key: 'articles-search',
    label: 'Articles',
    search: async (q) => {
      if (!q) {
        return []
      }

      const { articles, fetchList } = useBlog()
      if (!articles.value.length) {
        await fetchList()
      }

      return articles.value
        .filter(article => article.title.search(searchTextRegExp(q)) !== -1)
        .map(article => ({
          id: `article-${article._path}`,
          label: article.title,
          suffix: article.description,
          icon: 'i-ph-newspaper',
          to: article._path
        }))
    }
  }]

  return {
    headerLinks,
    footerLinks,
    searchLinks,
    searchGroups
  }
}

export const useNavigation = createSharedComposable(_useNavigation)
