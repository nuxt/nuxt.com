import { createSharedComposable } from '@vueuse/core'

const _useNavigation = () => {
  const headerLinks = computed(() => {
    const route = useRoute()

    return [{
      label: 'Docs',
      icon: 'i-ph-book-bookmark-duotone',
      to: '/docs',
      search: false,
      children: [{
        label: 'Get Started',
        description: 'Learn how to get started with Nuxt.',
        icon: 'i-ph-rocket-launch-duotone',
        to: '/docs/getting-started',
        active: route.path.startsWith('/docs/getting-started')
      }, {
        label: 'Guide',
        description: 'Learn how to build and deploy Nuxt applications.',
        icon: 'i-ph-book-open-duotone',
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
        icon: 'i-ph-app-window-duotone',
        to: '/docs/examples',
        active: route.path.startsWith('/docs/examples')
      }, {
        label: 'Community',
        description: 'Find answers and support from the community.',
        icon: 'i-ph-chats-teardrop-duotone',
        to: '/docs/community',
        active: route.path.startsWith('/docs/community')
      }]
    }, {
      label: 'Integrations',
      to: '/modules',
      search: false,
      active: route.path.startsWith('/modules') || route.path.startsWith('/deploy'),
      children: [{
        label: 'Modules',
        description: 'Supercharge your Nuxt project with modules.',
        icon: 'i-ph-puzzle-piece-duotone',
        to: '/modules'
      }, {
        label: 'Hosting',
        description: 'Deploy your Nuxt project anywhere.',
        icon: 'i-ph-rocket-launch-duotone',
        to: '/deploy'
      }]
    }, {
      label: 'Resources',
      to: '/templates',
      search: false,
      active: route.path.startsWith('/templates') || route.path.startsWith('/video-courses'),
      children: [{
        label: 'Templates',
        icon: 'i-ph-browsers-duotone',
        description: 'Start your next project with a Nuxt template.',
        to: '/templates'
      }, {
        label: 'Video Courses',
        description: 'Learn Nuxt by watching video courses.',
        icon: 'i-ph-graduation-cap-duotone',
        to: '/video-courses'
      }]
    }, {
      label: 'Showcase',
      icon: 'i-ph-projector-screen-duotone',
      to: '/showcase'
    }, {
      label: 'Enterprise',
      icon: 'i-ph-buildings-duotone',
      to: '/enterprise',
      search: false,
      children: [{
        label: 'Support',
        to: '/enterprise/support',
        description: 'Get help with Nuxt.js directly from the team that creates it.',
        icon: 'i-ph-lifebuoy-duotone'
      }, {
        label: 'Agencies',
        to: '/enterprise/agencies',
        description: 'Find an agency that specializes in Nuxt.js development.',
        icon: 'i-ph-handshake-duotone'
      }, {
        label: 'Sponsors',
        to: '/enterprise/sponsors',
        description: 'Become a sponsor and get your logo on our README on GitHub with a link to your site.',
        icon: 'i-ph-hand-heart-duotone'
      }, {
        label: 'Jobs',
        to: '/enterprise/jobs',
        description: 'Find a job or post a job opportunity for Nuxt.js experts.',
        icon: 'i-ph-briefcase-duotone'
      }]
    }, {
      label: 'Blog',
      icon: 'i-ph-newspaper-duotone',
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
      label: 'Nuxt on GitHub',
      to: 'https://github.com/nuxt',
      target: '_blank'
    }, {
      label: 'Team',
      to: '/team'
    }, {
      label: 'Design Kit',
      to: '/design-kit'
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
      label: 'Jobs',
      to: '/enterprise/jobs'
    }, {
      label: 'Sponsors',
      to: '/enterprise/sponsors'
    }]
  }, {
    label: 'Solutions',
    children: [{
      label: 'Nuxt Content',
      to: 'https://content.nuxt.com/',
      target: '_blank'
    }, {
      label: 'Nuxt DevTools',
      to: 'https://devtools.nuxt.com/',
      target: '_blank'
    }, {
      label: 'Nuxt Image',
      to: 'https://image.nuxt.com/',
      target: '_blank'
    }, {
      label: 'Nuxt UI',
      to: 'https://ui.nuxt.com/',
      target: '_blank'
    }]
  }]

  const searchLinks = computed(() => [...headerLinks.value.map(link => {
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
    icon: 'i-ph-users-duotone',
    to: '/team'
  }, {
    label: 'Design Kit',
    icon: 'i-ph-palette-duotone',
    to: '/design-kit'
  }, {
    label: 'Newsletter',
    icon: 'i-ph-envelope-simple-duotone',
    to: '/newsletter'
  }])

  const searchGroups = [{
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
          label: module.name,
          suffix: module.description,
          avatar: {
            src: moduleImage(module.icon)
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
          avatar: hosting.logoSrc ? {
            src: hosting.logoSrc
          } : undefined,
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
