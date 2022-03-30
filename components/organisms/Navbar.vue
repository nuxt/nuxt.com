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
            :key="link.label"
            :to="link.to"
            :exact="link.exact"
            class="text-sm font-medium hover:u-text-gray-900 lg:text-base"
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
