<template>
  <header
    class="sticky lg:relative top-0 z-10"
    :class="hasScrolledPastNavbar ? 'backdrop-blur-md bg-white/75 dark:bg-black/75' : ''"
  >
    <NavbarDialog v-model="isOpen" :links="links" />

    <UContainer padded class="relative">
      <div class="grid items-center h-16 grid-cols-6 gap-3 lg:h-20 lg:justify-center">
        <div class="lg:hidden">
          <button @click="isOpen = true">
            <UIcon name="heroicons-outline:menu-alt-2" class="w-6 h-6 flex-shrink-0" />
          </button>
        </div>

        <div class="flex justify-center col-span-4 lg:col-span-1 lg:justify-start">
          <NuxtLink to="/" class="block u-text-black focus:outline-none">
            <LogoFull class="hidden w-auto h-8 sm:block" />
            <Logo class="block w-auto h-6 sm:hidden" />
          </NuxtLink>
        </div>

        <ul class="justify-center hidden lg:col-span-4 gap-x-10 lg:flex">
          <li
            v-for="(link, index) in links"
            :key="index"
          >
            <UPopover v-if="link.options?.length" mode="hover" container-class="z-10 py-4" panel-class="w-screen max-w-md xl:max-w-xl">
              <UButton
                :label="link.title"
                variant="transparent"
                size="lg"
                class="!p-0"
                icon="heroicons-outline:chevron-down"
                icon-base-class="!h-4 !w-4 flex-shrink-0"
                trailing
              />

              <template #panel="{ close }">
                <UCard shadow-class="shadow-lg" rounded-class="rounded-lg" ring-class="ring-1 u-ring-gray-200">
                  <div class="grid gap-6 sm:gap-8 lg:grid-cols-2">
                    <ULink v-for="(option, optionIndex) in link.options" :key="optionIndex" :to="option.to" class="-m-3 p-3 flex items-start rounded-lg hover:u-bg-gray-50 transition ease-in-out duration-150" @click="close">
                      <div class="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-md text-white sm:h-12 sm:w-12">
                        <img :src="option.icon" class="h-8 w-8" aria-hidden="true">
                      </div>
                      <div class="ml-4">
                        <p class="text-base font-medium u-text-gray-900">
                          {{ option.title }}
                        </p>
                        <p class="mt-1 text-sm text-gray-500 line-clamp-3 max-w-xs">
                          {{ option.description }}
                        </p>
                      </div>
                    </ULink>
                  </div>
                </UCard>
              </template>
            </UPopover>

            <ULink
              v-else
              :to="link.slug"
              :exact="link.exact"
              class="text-sm lg:text-base focus:outline-none"
              active-class="font-semibold u-text-gray-900"
              inactive-class="font-medium u-text-gray-500 hover:u-text-gray-900 focus:u-text-gray-700"
            >
              {{ link.title }}
            </ULink>
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

const isOpen = ref(false)

const links = computed(() => {
  const team = activeTeam.value || route.params.team || user.value?.username

  return [{
    title: 'Docs',
    icon: 'heroicons-outline:book-open',
    options: [{
      title: 'Framework',
      description: 'The Hybrid Vue Framework',
      to: '/docs/framework',
      icon: '/docs/framework.svg'
    }, {
      title: 'Content',
      description: 'Git-based Headless CMS',
      to: '/docs/content',
      icon: '/docs/content.svg'
    }]
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
