<template>
  <header class="u-bg-white">
    <NavbarDialog v-model="isOpen" :links="links" />

    <UContainer padded class="relative">
      <div class="grid items-center h-16 grid-cols-6 gap-3 lg:h-20 lg:justify-center">
        <UButton
          variant="transparent"
          class="-ml-2 lg:hidden"
          icon="heroicons-outline:menu"
          @click="isOpen = true"
        />

        <div class="flex justify-center col-span-4 lg:col-span-1 lg:justify-start">
          <NuxtLink to="/" class="block u-text-black">
            <LogoFull class="hidden w-auto h-8 sm:block" />
            <Logo class="block w-auto h-6 sm:hidden" />
          </NuxtLink>
        </div>

        <div class="justify-center hidden lg:col-span-4 gap-x-10 lg:flex">
          <ULink
            v-for="link in links"
            :key="link.title"
            :to="link.slug"
            :exact="link.exact"
            class="text-sm lg:text-base"
            active-class="font-semibold u-text-gray-900"
            inactive-class="font-medium u-text-gray-500 hover:u-text-gray-900"
          >
            {{ link.title }}
          </ULink>
        </div>

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

const isOpen = ref(false)

const links = computed(() => {
  const team = activeTeam.value || route.params.team || user.value?.username

  return [{
    title: 'Docs',
    slug: '/docs/framework',
    exact: false,
    icon: 'heroicons-outline:book-open'
  }, {
    title: 'Integrations',
    slug: '/integrations',
    exact: true,
    icon: 'heroicons-outline:sparkles'
  }, {
    title: 'Templates',
    slug: '/templates',
    exact: true,
    icon: 'heroicons-outline:template'
  }, {
    title: 'Projects',
    slug: team ? `/@${team}/projects` : '/projects',
    exact: true,
    icon: 'heroicons-outline:collection'
  }, {
    title: 'Community',
    slug: team ? `/@${team}` : '/community',
    exact: true,
    icon: 'heroicons-outline:globe'
  }]
})

const onClick = () => {
  window.location = getProviderAuthenticationUrl('github') as unknown as Location
}
</script>
