<template>
  <header class="bg-white dark:bg-black">
    <UContainer padded>
      <div class="grid grid-cols-2 sm:grid-cols-6 gap-3 items-center h-16">
        <div class="flex justify-start">
          <NuxtLink to="/" class="block u-text-black hover:text-[#00DC82] transition-colors">
            <LogoFull class="h-8 w-auto hidden sm:block" />
            <Logo class="h-6 w-auto block sm:hidden" />
          </NuxtLink>
        </div>

        <UPills :links="links" class="justify-center col-span-4" />

        <div class="flex justify-end">
          <TeamsDropdown v-if="user" />
          <UButton
            v-else
            label="Login"
            icon="fa-brands:github"
            variant="secondary"
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
    exact: true
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
