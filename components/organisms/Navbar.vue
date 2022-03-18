<template>
  <header class="bg-white dark:bg-black">
    <NavbarMenu :links="links" />
    <UContainer padded class="relative">
      <div class="grid items-center h-16 grid-cols-6 gap-3 md:h-20 md:justify-center">
        <UButton
          variant="transparent"
          class="-ml-2 md:hidden"
          icon="heroicons-solid:menu"
          @click="toggle()"
        />

        <div class="flex justify-center col-span-4 md:col-span-1 md:justify-start">
          <NuxtLink to="/" class="block u-text-black">
            <LogoFull class="hidden w-auto h-8 sm:block" />
            <Logo class="block w-auto h-6 sm:hidden" />
          </NuxtLink>
        </div>

        <div v-if="!visible" class="justify-center hidden md:col-span-4 gap-x-10 md:flex">
          <ULink
            v-for="link in links"
            :key="link.label"
            :to="link.to"
            :exact="link.exact"
            class="text-sm font-medium hover:u-text-gray-900 md:text-base"
            active-class="font-semibold u-text-gray-900"
            inactive-class="u-text-gray-500"
          >
            {{ link.label }}
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
    <div
      class="fixed inset-x-0 top-0 z-10 h-full transition-opacity duration-300 ease-linear backdrop-blur-md"
      :class="[visible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none']"
      @click="toggle"
    />
  </header>
</template>

<script setup lang="ts">
import type { Ref } from 'vue'
import type { User } from '~/types'

const user = useStrapiUser() as Ref<User>
const { getProviderAuthenticationUrl } = useStrapiAuth()
const route = useRoute()
const activeTeam = useTeam()
const { visible, toggle } = useMenu()

const links = computed(() => {
  const team = activeTeam.value || route.params.team || user.value?.username

  return [{
    label: 'Docs',
    to: { name: 'docs-framework' },
    exact: false,
    icon: 'docs.svg'
  }, {
    label: 'Integrations',
    to: { name: 'integrations' },
    exact: true,
    icon: 'integrations.svg'
  }, {
    label: 'Templates',
    to: { name: 'templates' },
    exact: true,
    icon: 'templates.svg'
  }, {
    label: 'Projects',
    to: team ? { name: '@team-projects', params: { team } } : { name: 'projects' },
    exact: true,
    icon: 'projects.svg'
  }, {
    label: 'Community',
    to: team ? { name: '@team', params: { team } } : { name: 'community' },
    exact: true,
    icon: 'community.svg'
  }]
})

const onClick = () => {
  window.location = getProviderAuthenticationUrl('github') as unknown as Location
}
</script>
