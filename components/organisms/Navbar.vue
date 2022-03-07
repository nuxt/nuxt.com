<template>
  <header class="bg-white dark:bg-black">
    <UContainer padded>
      <div class="grid items-center h-16 grid-cols-2 gap-3 sm:grid-cols-6">
        <div class="flex justify-start">
          <NuxtLink to="/" class="block u-text-black">
            <LogoFull class="hidden w-auto h-8 sm:block" />
            <Logo class="block w-auto h-6 sm:hidden" />
          </NuxtLink>
        </div>

        <div class="flex justify-center col-span-4 gap-x-8">
          <ULink
            v-for="link in links"
            :key="link.label"
            :to="link.to"
            :exact="link.exact"
            class="hover:u-text-gray-900"
            active-class="font-medium u-text-gray-900"
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

const links = computed(() => {
  const team = activeTeam.value || route.params.team || user.value?.username

  return [{
    label: 'Docs',
    to: { name: 'docs-framework' },
    exact: false
  }, {
    label: 'Integrations',
    to: { name: 'integrations' },
    exact: true
  }, {
    label: 'Templates',
    to: { name: 'templates' },
    exact: true
  }, {
    label: 'Projects',
    to: team ? { name: '@team-projects', params: { team } } : { name: 'projects' },
    exact: true
  }, {
    label: 'Community',
    to: team ? { name: '@team', params: { team } } : { name: 'community' },
    exact: true
  }]
})

const onClick = () => {
  window.location = getProviderAuthenticationUrl('github') as unknown as Location
}
</script>
