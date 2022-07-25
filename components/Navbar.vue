<template>
  <header
    class="sticky top-0 z-30 lg:relative transition-all duration-[0.4s] ease"
    :class="{ 'backdrop-blur-md bg-white/75 dark:bg-black/75 lg:!bg-transparent': hasScrolledPastNavbar }"
  >
    <NavbarDialog v-model="isOpen" :links="links" />

    <UContainer padded class="relative">
      <div class="grid items-center h-16 grid-cols-6 gap-3 lg:h-20 lg:justify-center">
        <div class="lg:hidden">
          <button @click="isOpen = true">
            <UIcon name="uil:align-left" class="flex-shrink-0 w-6 h-6" />
          </button>
        </div>

        <div class="flex justify-center col-span-4 lg:col-span-1 lg:justify-start">
          <NuxtLink to="/" class="block u-text-black focus:outline-none">
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

        <div class="flex items-center justify-end gap-3">
          <UButton icon="uil:twitter" variant="transparent" to="https://twitter.com/nuxt_js" target="_blank" class="!p-0 u-text-gray-900" />
          <UButton icon="fa-brands:discord" variant="transparent" to="https://discord.com/invite/ps2h6QT" target="_blank" class="!p-0 u-text-gray-900" />
          <UButton icon="uil:github" variant="transparent" to="https://github.com/nuxt/framework" target="_blank" class="!p-0 u-text-gray-900" />
        </div>
      </div>
    </UContainer>
  </header>
</template>

<script setup lang="ts">
import type { NavItem } from '@nuxt/content/dist/runtime/types'
import type { Ref } from 'vue'

const config = useRuntimeConfig()
const route = useRoute()
const { hasScrolledPastNavbar } = useNavbarScroll()

const isOpen = ref(false)

const links: Ref<NavItem[]> = ref([{
  title: 'Framework',
  icon: 'uil:book-open',
  _path: '/docs'
}, {
  title: 'Modules',
  icon: 'heroicons-outline:sparkles',
  _path: '/modules'
},
{
  title: 'Resources',
  _path: '/resources',
  icon: 'uil:object-group'
}, {
  title: 'Community',
  _path: '/community',
  icon: 'uil:globe'
}, {
  title: 'Company',
  _path: '/company',
  hidden: true,
  icon: 'uil:building'
}, {
  title: 'Studio',
  _path: config.studioUrl,
  icon: 'uil:files-landscapes',
  target: '_blank'
}])

const visibleLinks = computed(() => links.value.filter(link => !link.hidden))

function isActive (link) {
  return link.exact ? route.fullPath === link._path : route.fullPath.startsWith(link._path)
}
</script>
