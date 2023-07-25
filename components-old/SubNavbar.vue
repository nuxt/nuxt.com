<template>
  <div
    class="sticky top-0 z-20 hidden border-t border-transparent lg:block"
    :class="hasScrolledPastSubNavbar ? 'backdrop-blur-md bg-white/75 dark:bg-black/75 shadow shadow-gray-200 dark:shadow-gray-900' : 'u-border-gray-200'"
  >
    <div class="container">
      <nav id="sub-nav" class="relative grid items-center justify-between h-16 grid-cols-2 gap-3 sm:grid-cols-6" :aria-label="title ? `${title} Sub Navigation`: 'Sub Navigation'">
        <div class="flex items-center justify-start">
          <Logo class="h-4 transition-all cursor-pointer" :class="[hasScrolledPastSubNavbar ? 'w-auto mr-3' : 'w-0']" @click="$router.push('/')" />

          <slot name="left">
            <component
              :is="!!to ? 'NuxtLink' : 'p'"
              v-if="title"
              :to="to"
              class="font-semibold u-text-gray-900"
              :class="[hasScrolledPastSubNavbar ? 'opacity-100' : 'opacity-0']"
              tabindex="-1"
            >
              {{ title }}
            </component>
          </slot>
        </div>

        <ul class="flex justify-center col-span-4 gap-x-8">
          <li
            v-for="(link, index) in links"
            :key="index"
          >
            <NuxtLink
              :to="link.redirect || navBottomLink(link)"
              :target="link.redirect && '_blank'"
              :class="{
                'u-text-gray-900 font-semibold _active': link.active || isActive(link),
                'font-medium u-text-gray-500 hover:u-text-gray-900 focus:u-text-gray-900': !isActive(link),
              }"
            >
              {{ link.title }}
            </NuxtLink>
          </li>
        </ul>

        <div class="flex justify-end gap-3">
          <slot name="right" />
        </div>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { NavItem } from '@nuxt/content/dist/runtime/types'

defineProps({
  title: {
    type: String,
    default: null
  },
  to: {
    type: String,
    default: null
  },
  links: {
    type: Array as PropType<Array<NavItem>>,
    default: () => []
  }
})

const route = useRoute()
const { hasScrolledPastSubNavbar } = useNavbarScroll()
const { navBottomLink } = useContentHelpers()

function isActive (link: NavItem) {
  return link.exact ? route.path === link._path : route.path.startsWith(link._path)
}
</script>
