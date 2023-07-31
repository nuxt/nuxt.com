<script setup lang="ts">
import type { NavItem } from '@nuxt/content/dist/runtime/types'

const navigation = inject<Ref<NavItem[]>>('navigation')

const router = useRouter()
const { navBottomLink } = useContentHelpers()
const { mapContentNavigation } = useUIKitContent()

const links = computed(() => mapContentNavigation(navigation.value))

const headerLinks = [{
  label: 'Docs',
  icon: 'i-ph-rocket-light',
  to: '/docs',
  click: (e) => {
    e.preventDefault()

    router.push(navBottomLink(navigation.value[0]))
  }
}, {
  label: 'Modules',
  icon: 'i-ph-plug-light',
  to: '/modules'
}, {
  label: 'Showcase',
  icon: 'i-ph-sparkle-light',
  to: '/showcase'
}, {
  label: 'Enterprise',
  icon: 'i-ph-app-window-light',
  to: '/enterprise'
}, {
  label: 'Blog',
  icon: 'i-ph-newspaper-light',
  to: '/blog'
}]
</script>

<template>
  <UHeader :links="headerLinks">
    <template #logo>
      <LogoFull class="hidden w-auto h-6 sm:block" />
      <Logo class="block w-auto h-6 sm:hidden" />
    </template>

    <template #right>
      <UColorModeButton />

      <UButton
        icon="i-octicon-star-fill-24"
        to="https://github.com/nuxt/nuxt"
        target="_blank"
        label="46.6k"
        color="gray"
        variant="ghost"
      />
    </template>

    <template #panel>
      <UNavigationTree :links="links" default-open :multiple="false" />

      <hr class="border-gray-200 dark:border-gray-800 border-dashed my-6">

      <div class="flex flex-col gap-y-4">
        <UButton
          to="https://github.com/nuxt/modules"
          color="gray"
          variant="link"
          label="Contribute on GitHub"
          icon="i-simple-icons-github"
          :padded="false"
        />
        <UButton
          to="/docs/guide/going-further/modules"
          color="gray"
          variant="link"
          label="Module Author guide"
          icon="i-ph-book-open"
          :padded="false"
        />
      </div>
    </template>
  </UHeader>
</template>
