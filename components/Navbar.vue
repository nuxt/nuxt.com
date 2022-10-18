<template>
  <header
    class="sticky top-0 z-30 lg:relative transition-all duration-[0.4s] ease"
    :class="{ 'backdrop-blur-md bg-white/75 dark:bg-black/75 lg:!bg-transparent': hasScrolledPastNavbar }"
  >
    <NavbarDialog v-model="isOpen" :links="links" />

    <UContainer padded class="relative">
      <nav class="grid items-center h-16 grid-cols-6 gap-3 lg:h-20 lg:justify-center">
        <div class="lg:hidden">
          <button @click="isOpen = true">
            <UIcon name="uil:bars" class="flex-shrink-0 w-6 h-6" />
          </button>
        </div>

        <div class="flex justify-center col-span-4 lg:col-span-1 lg:justify-start">
          <NuxtLink to="/" class="block u-text-black">
            <LogoFull class="hidden w-auto h-6 sm:block" />
            <Logo class="block w-auto h-6 sm:hidden" />
          </NuxtLink>
        </div>

        <ul class="justify-center hidden lg:col-span-4 gap-x-10 lg:flex">
          <li v-for="(link, index) in visibleLinks" :key="index">
            <NuxtLink
              :to="link._path"
              :exact="link.exact"
              :target="link.target"
              class="text-sm lg:text-base"
              :class="{
                'font-semibold u-text-gray-900': isActive(link),
                'font-medium u-text-gray-500 hover:u-text-gray-900 focus:u-text-gray-900': !isActive(link),
              }"
            >
              {{ link.title }}
            </NuxtLink>
          </li>
        </ul>

        <ul class="flex items-center justify-end gap-3">
          <li>
            <UButton
              icon="uil:twitter"
              variant="transparent"
              to="https://twitter.com/nuxt_js"
              target="_blank"
              class="!p-0 u-text-gray-900"
              title="Go to Nuxt Twitter Account"
            />
          </li>
          <li>
            <UButton
              icon="fa-brands:discord"
              variant="transparent"
              to="https://discord.com/invite/ps2h6QT"
              target="_blank"
              class="!p-0 u-text-gray-900 focus-visible:ring-2"
              title="Go to Nuxt Discord Server"
            />
          </li>
          <li>
            <UButton
              icon="uil:github"
              variant="transparent"
              to="https://github.com/nuxt/framework"
              target="_blank"
              class="!p-0 u-text-gray-900"
              title="Go to Nuxt Github page"
            />
          </li>
        </ul>
      </nav>
    </UContainer>
  </header>
</template>

<script setup lang="ts">
import type { NavItem } from '@nuxt/content/dist/runtime/types'
import type { Ref } from 'vue'

const route = useRoute()
const { hasScrolledPastNavbar } = useNavbarScroll()

const isOpen = ref(false)

const links: Ref<NavItem[]> = ref([{
  title: 'Docs',
  icon: 'uil:book-open',
  _path: '/docs/getting-started/introduction'
}, {
  title: 'Modules',
  icon: 'uil:palette',
  _path: '/modules'
},
{
  title: 'Showcase',
  _path: '/showcase',
  icon: 'uil:object-group'
}, {
  title: 'Partners',
  _path: '/partners/support',
  icon: 'uil:globe'
}])

const visibleLinks = computed(() => links.value.filter(link => !link.hidden))

function isActive (link) {
  return link.exact ? route.fullPath === link._path : route.fullPath.startsWith(link._path)
}
</script>
