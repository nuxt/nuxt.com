
<template>
  <footer class="relative border-t u-bg-white u-border-gray-200">
    <div class="absolute inset-x-0 flex items-center justify-center -top-3">
      <div class="relative flex justify-center h-10 w-14">
        <div class="absolute w-full h-full inset-0 -top-[2px] blur-[6px] u-bg-white rounded-full" />
        <Logo class="relative w-5 h-5 u-text-gray-200" />
      </div>
    </div>

    <div class="container py-6">
      <div class="sm:relative flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <div class=" flex flex-col-reverse items-center gap-3 sm:flex-row sm:w-40 md:w-60">
          <ThemeSelect class="z-10 order-1 sm:order-none" size="sm" />
          <span class="text-sm u-text-gray-500">© 2016-2023 Nuxt - MIT License</span>
        </div>

        <ul class="flex flex-wrap justify-center text-sm gap-x-6 gap-y-2">
          <li v-for="link in links" :key="link.title">
            <NuxtLink :to="link._path" class="font-medium u-text-gray-500 hover:u-text-gray-900 focus:u-text-gray-900" active-class="u-text-gray-900">
              {{ link.title }}
            </NuxtLink>
          </li>
        </ul>
        <SocialLinks class="z-10 sm:w-40 md:w-60" />
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import type { NavItem } from '@nuxt/content/dist/runtime/types'

const links: NavItem[] = [
  {
    title: 'Support',
    _path: '/support/solutions'
  },
  {
    title: 'Design Kit',
    _path: '/design-kit'
  },
  {
    title: 'NuxtLabs',
    _path: 'https://nuxtlabs.com'
  },
  {
    title: 'Nuxt Studio',
    _path: 'https://nuxt.studio'
  }
]
</script>
