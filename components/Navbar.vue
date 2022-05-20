<template>
  <header
    class="sticky top-0 z-10 lg:relative"
    :class="hasScrolledPastNavbar ? 'backdrop-blur-md bg-white/75 dark:bg-black/75' : ''"
  >
    <NavbarDialog v-model="isOpen" :links="links" />

    <UContainer padded class="relative">
      <div class="grid items-center h-16 grid-cols-6 gap-3 lg:h-20 lg:justify-center">
        <div class="lg:hidden">
          <button @click="isOpen = true">
            <UIcon name="heroicons-outline:menu-alt-2" class="flex-shrink-0 w-6 h-6" />
          </button>
        </div>

        <div class="flex justify-center col-span-4 lg:col-span-1 lg:justify-start">
          <NuxtLink to="/" class="block u-text-black focus:outline-none">
            <LogoFull class="hidden w-auto h-8 sm:block" />
            <Logo class="block w-auto h-6 sm:hidden" />
          </NuxtLink>
        </div>

        <ul class="justify-center hidden lg:col-span-4 gap-x-10 lg:flex">
          <li v-for="(link, index) in links" :key="index">
            <NuxtLink
              :to="link._path"
              :exact="link.exact"
              class="text-sm lg:text-base focus:outline-none"
              :class="{
                'font-semibold u-text-gray-900': isActive(link),
                'font-medium u-text-gray-500 hover:u-text-gray-900 focus:u-text-gray-900': !isActive(link),
              }"
            >
              {{ link.title }}
            </NuxtLink>
          </li>
        </ul>

        <div class="flex justify-end">
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
      </div>
    </UContainer>
  </header>
</template>

<script setup lang="ts">
import type { Ref } from 'vue'
import type { User } from '~/types'

const user = useStrapiUser() as Ref<User>
const { getProviderAuthenticationUrl } = useStrapiAuth()
const route = useRoute()
const activeTeam = useTeam()
const { hasScrolledPastNavbar } = useNavbarScroll()
const { categories } = useIntegrations()

const isOpen = ref(false)

const links = computed(() => {
  const team = activeTeam.value || route.params.team || user.value?.username

  return [{
    title: 'Framework',
    icon: 'heroicons-outline:book-open',
    _path: '/docs/framework'
  }, {
    title: 'Integrations',
    icon: 'heroicons-outline:sparkles',
    _path: '/integrations',
    children: [{
      title: 'Officials',
      icon: 'heroicons-outline:star',
      children: [{
        title: 'Content',
        _path: '/docs/content'
      }, {
        title: 'Image',
        _path: 'https://image.nuxtjs.org',
        target: '_blank'
      }, {
        title: 'Auth',
        _path: 'https://auth.nuxtjs.org',
        target: '_blank'
      }, {
        title: 'i18n',
        _path: 'https://i18n.nuxtjs.org',
        target: '_blank'
      }, {
        title: 'PWA',
        _path: 'https://pwa.nuxtjs.org',
        target: '_blank'
      }]
    }, {
      title: 'Categories',
      icon: 'heroicons-outline:template',
      class: 'col-span-4',
      children: [
        ...categories.value.map(category => ({
          ...category,
          _path: `/integrations?category=${category.key}`
        })),
        { title: 'All integrations', _path: '/integrations', class: 'font-semibold' }
      ]
    }]
  }, {
    title: 'Projects',
    _path: team && user.value?.beta ? `/@${team}/projects` : '/projects',
    exact: true,
    icon: 'heroicons-outline:collection'
  },
  {
    title: 'Resources',
    _path: '/resources',
    icon: 'heroicons-outline:template'
  }, {
    title: 'Community',
    _path: '/community',
    icon: 'heroicons-outline:globe'
  }]
})

const onClick = () => {
  window.location = getProviderAuthenticationUrl('github') as unknown as Location
}

function isActive (link) {
  return link.exact ? route.fullPath === link._path : route.fullPath.startsWith(link._path)
}
</script>
