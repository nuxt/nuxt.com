<template>
  <UContainer padded class="relative">
    <div
      class="fixed top-0 left-0 w-full z-20 h-full shadow shadow-gray-200 dark:shadow-gray-900 bg-white dark:bg-black max-w-[425px] transition transform ease-in-out duration-300"
      :class="[visible ? 'pointer-events-auto translate-x-0' : '-translate-x-full pointer-events-none']"
    >
      <div>
        <!-- header -->
        <div class="grid items-center h-16 grid-cols-6 px-4 border-b u-border-gray-200">
          <UButton
            variant="transparent"
            :icon="!isSubMenu ? 'heroicons-solid:x' : 'heroicons-solid:arrow-left'"
            class="-ml-2"
            @click="!isSubMenu ? close() : isSubMenu = false"
          />

          <div class="flex justify-center col-span-4">
            <NuxtLink v-if="!isSubMenu" to="/" class="block u-text-black">
              <LogoFull class="hidden w-auto h-8 sm:block" />
              <Logo class="block w-auto h-6 sm:hidden" />
            </NuxtLink>
            <div v-else class="font-semibold u-text-gray-900">
              {{ currentParent.label }}
            </div>
          </div>

          <div class="flex justify-end">
            <div v-if="!isSubMenu">
              <TeamsDropdown v-if="user" />
              <UButton
                v-else
                label="Login"
                icon="fa-brands:github"
                variant="primary"
                size="sm"
                @click="onClick"
              />
            </div>
            <UButton
              v-else
              icon="heroicons-outline:search"
              variant="transparant"
              size="md"
            />
          </div>
        </div>
        <!-- Links -->
        <div v-if="!isSubMenu" class="pt-4">
          <ul
            v-for="link in links"
            :key="link.label"
            class="flex justify-between px-4 py-2 font-medium text-md hover:u-text-gray-900 md:text-base"
          >
            <AsideItem v-if="link.children && link.children.length" :item="link" disabled />
            <ULink v-else :to="link.to" inactive-class="font-medium u-text-gray-500" active-class="font-semibold u-text-gray-900" exact>
              {{ link.label }}
            </ULink>
            <img :src="`nav/${link.icon}`">
          </ul>
        </div>
        <div v-else>
          <div v-if="currentSubNav">
            <ul
              v-for="link in currentSubNav"
              :key="link.label"
              class="flex justify-between px-4 py-2 font-medium text-md hover:u-text-gray-900 md:text-base"
            >
              <AsideItem v-if="link.children && link.children.length" :item="link" disabled />
              <ULink v-else :to="link.to" inactive-class="font-medium u-text-gray-500" active-class="font-semibold u-text-gray-900" exact>
                {{ link.label }}
              </ULink>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </UContainer>
</template>

<script setup lang="ts">
import type { Ref } from 'vue'
import { withBase } from 'ufo'
import type { User } from '~/types'

defineProps({
  links: {
    type: Array,
    default: () => []
  }
})

const activeTeam = useTeam()

const user = useStrapiUser() as Ref<User>
const { visible, close, isSubMenu, currentSubNav, currentParent } = useMenu()

const route = useRoute()

const versions = ref([{ text: 'v3', value: '3' }, { text: 'v2', value: '2' }])
const version = ref(versions.value[0])

const withContentBase = (url: string) => withBase(url, '/api/' + useRuntimeConfig().content.basePath)

// first nav level
const navLinks = navLink => ({ to: navLink.to || navLink.slug, label: navLink.title, children: navLink.children?.map(items) || null })
// second
const items = item => ({ to: item.to || item.slug, label: item.title, children: item.children?.map(itemLinks) || null })
// third
const itemLinks = itemLink => ({ to: itemLink.to || itemLink.slug, label: itemLink.title })

const currentNav = computed(() => {
  return links.value.map(navLinks)
})

const links = computed(() => {
  const team = activeTeam.value || route.params.team || user.value?.username

  return [{
    label: 'Docs',
    to: { name: 'docs-framework' },
    exact: false,
    icon: 'docs.svg',
    slug: '/docs/framework',
    children: [
      {
        slug: '/docs/framework/guides',
        title: 'Guides',
        children: [
          {
            slug: '/docs/framework/guides/usage',
            title: 'Usage',
            children: [
              {
                id: 'content:docs:framework:2.guides:1.usage:1.data-fetching.md',
                title: 'Data Fetching',
                slug: '/docs/framework/guides/usage/data-fetching',
                draft: false,
                partial: false
              },
              {
                id: 'content:docs:framework:2.guides:1.usage:2.state.md',
                title: 'State',
                slug: '/docs/framework/guides/usage/state',
                draft: false,
                partial: false
              },
              {
                id: 'content:docs:framework:2.guides:1.usage:3.meta-tags.md',
                title: 'Meta Tags',
                slug: '/docs/framework/guides/usage/meta-tags',
                draft: false,
                partial: false
              },
              {
                id: 'content:docs:framework:2.guides:1.usage:4.nuxt-app.md',
                title: 'NuxtApp',
                slug: '/docs/framework/guides/usage/nuxt-app',
                draft: false,
                partial: false
              },
              {
                id: 'content:docs:framework:2.guides:1.usage:5.runtime-config.md',
                title: 'Runtime Config',
                slug: '/docs/framework/guides/usage/runtime-config',
                draft: false,
                partial: false
              },
              {
                id: 'content:docs:framework:2.guides:1.usage:6.cookies.md',
                title: 'Cookies',
                slug: '/docs/framework/guides/usage/cookies',
                draft: false,
                partial: false
              },
              {
                id: 'content:docs:framework:2.guides:1.usage:7.ssr.md',
                title: 'SSR utilities',
                slug: '/docs/framework/guides/usage/ssr',
                draft: false,
                partial: false
              }
            ]
          },
          {
            slug: '/docs/framework/guides/directory-structure',
            title: 'Directory Structure',
            children: [
              {
                id: 'content:docs:framework:2.guides:2.directory-structure:1.nuxt.md',
                title: '.nuxt',
                slug: '/docs/framework/guides/directory-structure/nuxt',
                draft: false,
                partial: false
              },
              {
                id: 'content:docs:framework:2.guides:2.directory-structure:10.pages.md',
                title: 'pages',
                slug: '/docs/framework/guides/directory-structure/pages',
                draft: false,
                partial: false
              },
              {
                id: 'content:docs:framework:2.guides:2.directory-structure:11.plugins.md',
                title: 'plugins',
                slug: '/docs/framework/guides/directory-structure/plugins',
                draft: false,
                partial: false
              },
              {
                id: 'content:docs:framework:2.guides:2.directory-structure:12.public.md',
                title: 'public',
                slug: '/docs/framework/guides/directory-structure/public',
                draft: false,
                partial: false
              },
              {
                id: 'content:docs:framework:2.guides:2.directory-structure:13.server.md',
                title: 'server',
                slug: '/docs/framework/guides/directory-structure/server',
                draft: false,
                partial: false
              },
              {
                id: 'content:docs:framework:2.guides:2.directory-structure:14.gitignore.md',
                title: '.gitignore',
                slug: '/docs/framework/guides/directory-structure/gitignore',
                draft: false,
                partial: false
              },
              {
                id: 'content:docs:framework:2.guides:2.directory-structure:15.app.md',
                title: 'app.vue',
                slug: '/docs/framework/guides/directory-structure/app',
                draft: false,
                partial: false
              },
              {
                id: 'content:docs:framework:2.guides:2.directory-structure:15.nuxt.config.md',
                title: 'nuxt.config.ts',
                slug: '/docs/framework/guides/directory-structure/nuxt.config',
                draft: false,
                partial: false
              },
              {
                id: 'content:docs:framework:2.guides:2.directory-structure:17.package.md',
                title: 'package.json',
                slug: '/docs/framework/guides/directory-structure/package',
                draft: false,
                partial: false
              },
              {
                id: 'content:docs:framework:2.guides:2.directory-structure:18.tsconfig.md',
                title: 'tsconfig.json',
                slug: '/docs/framework/guides/directory-structure/tsconfig',
                draft: false,
                partial: false
              },
              {
                id: 'content:docs:framework:2.guides:2.directory-structure:2.output.md',
                title: '.output',
                slug: '/docs/framework/guides/directory-structure/output',
                draft: false,
                partial: false
              },
              {
                id: 'content:docs:framework:2.guides:2.directory-structure:3.assets.md',
                title: 'assets',
                slug: '/docs/framework/guides/directory-structure/assets',
                draft: false,
                partial: false
              },
              {
                id: 'content:docs:framework:2.guides:2.directory-structure:4.components.md',
                title: 'components',
                slug: '/docs/framework/guides/directory-structure/components',
                draft: false,
                partial: false
              },
              {
                id: 'content:docs:framework:2.guides:2.directory-structure:5.composables.md',
                title: 'composables',
                slug: '/docs/framework/guides/directory-structure/composables',
                draft: false,
                partial: false
              },
              {
                id: 'content:docs:framework:2.guides:2.directory-structure:6.layouts.md',
                title: 'layouts',
                slug: '/docs/framework/guides/directory-structure/layouts',
                draft: false,
                partial: false
              },
              {
                id: 'content:docs:framework:2.guides:2.directory-structure:7.middleware.md',
                title: 'middleware',
                slug: '/docs/framework/guides/directory-structure/middleware',
                draft: false,
                partial: false
              },
              {
                id: 'content:docs:framework:2.guides:2.directory-structure:9.node_modules.md',
                title: 'node_modules',
                slug: '/docs/framework/guides/directory-structure/node_modules',
                draft: false,
                partial: false
              }
            ]
          },
          {
            slug: '/docs/framework/guides/deployment',
            title: 'Deployment',
            children: [
              {
                id: 'content:docs:framework:2.guides:3.deployment:1.azure.md',
                title: 'Azure',
                slug: '/docs/framework/guides/deployment/azure',
                draft: false,
                partial: false
              },
              {
                id: 'content:docs:framework:2.guides:3.deployment:2.cloudflare.md',
                title: 'Cloudflare Workers',
                slug: '/docs/framework/guides/deployment/cloudflare',
                draft: false,
                partial: false
              },
              {
                id: 'content:docs:framework:2.guides:3.deployment:3.firebase.md',
                title: 'Firebase Hosting',
                slug: '/docs/framework/guides/deployment/firebase',
                draft: false,
                partial: false
              },
              {
                id: 'content:docs:framework:2.guides:3.deployment:4.netlify.md',
                title: 'Netlify',
                slug: '/docs/framework/guides/deployment/netlify',
                draft: false,
                partial: false
              },
              {
                id: 'content:docs:framework:2.guides:3.deployment:5.pm2.md',
                title: 'PM2',
                slug: '/docs/framework/guides/deployment/pm2',
                draft: false,
                partial: false
              },
              {
                id: 'content:docs:framework:2.guides:3.deployment:6.vercel.md',
                title: 'Vercel',
                slug: '/docs/framework/guides/deployment/vercel',
                draft: false,
                partial: false
              },
              {
                id: 'content:docs:framework:2.guides:3.deployment:99.presets.md',
                title: 'Presets',
                slug: '/docs/framework/guides/deployment/presets',
                draft: false,
                partial: false
              }
            ]
          },
          {
            slug: '/docs/framework/guides/advanced',
            title: 'Advanced',
            children: [
              {
                id: 'content:docs:framework:2.guides:4.advanced:1.nuxt.md',
                title: 'Nuxt Internals',
                slug: '/docs/framework/guides/advanced/nuxt',
                draft: false,
                partial: false
              },
              {
                id: 'content:docs:framework:2.guides:4.advanced:2.modules.md',
                title: 'Nuxt Modules',
                slug: '/docs/framework/guides/advanced/modules',
                draft: false,
                partial: false
              },
              {
                id: 'content:docs:framework:2.guides:4.advanced:3.kit.md',
                title: 'Nuxt Kit',
                slug: '/docs/framework/guides/advanced/kit',
                draft: false,
                partial: false
              },
              {
                id: 'content:docs:framework:2.guides:4.advanced:4.hooks.md',
                title: 'Lifecycle Hooks',
                slug: '/docs/framework/guides/advanced/hooks',
                draft: false,
                partial: false
              }
            ]
          }
        ]
      },
      {
        id: 'content:docs:framework:1.get-started:index.md',
        title: 'Get Started',
        slug: '/docs/framework/get-started',
        children: [
          {
            id: 'content:docs:framework:1.get-started:index.md',
            title: 'Get Started',
            slug: '/docs/framework/get-started',
            draft: false,
            partial: false
          }
        ]
      },
      {
        id: 'content:docs:framework:3.api-reference:index.md',
        title: 'API Reference',
        slug: '/docs/framework/api-reference',
        children: [
          {
            id: 'content:docs:framework:3.api-reference:index.md',
            title: 'API Reference',
            slug: '/docs/framework/api-reference',
            draft: false,
            partial: false
          }
        ]
      },
      {
        id: 'content:docs:framework:4.examples:index.md',
        title: 'Examples',
        slug: '/docs/framework/examples',
        children: [
          {
            id: 'content:docs:framework:4.examples:index.md',
            title: 'Examples',
            slug: '/docs/framework/examples',
            draft: false,
            partial: false
          }
        ]
      },
      {
        id: 'content:docs:framework:5.releases:index.md',
        title: 'Releases',
        slug: '/docs/framework/releases',
        children: [
          {
            id: 'content:docs:framework:5.releases:index.md',
            title: 'Releases',
            slug: '/docs/framework/releases',
            draft: false,
            partial: false
          }
        ]
      }
    ]
  }, {
    label: 'Integrations',
    to: { name: 'integrations' },
    exact: true,
    icon: 'integrations.svg',
    children: null
  }, {
    label: 'Templates',
    to: { name: 'templates' },
    exact: true,
    icon: 'templates.svg',
    children: null
  }, {
    label: 'Projects',
    to: team ? { name: '@team-projects', params: { team } } : { name: 'projects' },
    exact: true,
    icon: 'projects.svg',
    children: null
  }, {
    label: 'Community',
    to: team ? { name: '@team', params: { team } } : { name: 'community' },
    exact: true,
    icon: 'community.svg',
    children: null
  }]
})
</script>
