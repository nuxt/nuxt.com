<template>
  <header class="bg-white dark:bg-black">
    <UContainer padded>
      <div class="grid items-center h-20 grid-cols-6 gap-3 md:justify-center">
        <UButton variant="transparent" :icon="visible ? 'heroicons-solid:x' : 'heroicons-solid:menu'" class="md:hidden" @click="toggle()" />

        <div class="flex justify-center col-span-4 md:col-span-1 md:justify-start">
          <NuxtLink to="/" class="block u-text-black">
            <LogoFull class="hidden w-auto h-8 sm:block" />
            <Logo class="block w-auto h-6 sm:hidden" />
          </NuxtLink>
        </div>

        <div class="justify-center hidden md:col-span-4 gap-x-10 md:flex">
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
    <ClientOnly v-if="visible">
      <teleport to="body">
        <!-- Scrim overlay -->
        <div
          :class="[visible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none']"
          class="w-[320px] fixed top-0 left-0 z-10 h-full transition shadow backdrop-blur-md shadow-gray-200 dark:shadow-gray-900"
          @click="toggle"
        >
          <div class="absolute top-0 w-full h-full bg-white bg-opacity-75 dark:bg-black w-[320px]" />
        </div>
      </teleport>
    </ClientOnly>
  </header>
</template>

<script setup lang="ts">
import type { Ref } from 'vue'
import type { User } from '~/types'

const user = useStrapiUser() as Ref<User>
const { getProviderAuthenticationUrl } = useStrapiAuth()
const route = useRoute()
const activeTeam = useTeam()
const { scrollBarGap, visible, open, close, toggle } = useMenu()

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

watch(visible, v => (v ? open() : close()))
</script>
