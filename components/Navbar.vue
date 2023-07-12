<template>
  <header class="sticky top-0 z-30 lg:relative transition-all duration-[0.4s] ease" :class="{
    'backdrop-blur-md bg-white/75 dark:bg-black/75 lg:!bg-transparent':
      hasScrolledPastNavbar,
  }">
    <NavbarDialog v-if="open" :links="links" />

    <div class="container">
      <nav id="main-nav" class="grid items-center h-16 grid-cols-6 gap-3 lg:h-20 lg:justify-center"
        aria-label="Primary Navigation">
        <div class="lg:hidden">
          <button type="button" @click="open">
            <Icon name="uil:bars" class="flex-shrink-0 w-6 h-6" aria-hidden="true" focusable="false" />
            <span class="sr-only">Menu</span>
          </button>
        </div>

        <div class="flex justify-center col-span-4 lg:col-span-1 lg:justify-start">
          <AppPopover class="inline-flex popover">
            <NuxtLink to="/" class="block u-text-black" title="Homepage"
              @click.right.prevent="$router.push('/design-kit')">
              <span class="sr-only">Go to homepage</span>
              <LogoFull class="hidden w-auto h-6 sm:block" />
              <Logo class="block w-auto h-6 sm:hidden" />
            </NuxtLink>

            <AppButton variant="transparent" size="sm" icon="ph:caret-down-fill" square
              class="lg:dark:opacity-50 lg:hover:dark:opacity-100" />

            <template #panel>
              <ul class="flex flex-col gap-y-1 p-2 bg-gray-950 w-[170px]">
                <li v-for="link in dropdownLinks" :key="link.title"
                  class="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors duration-300">
                  <NuxtLink :to="link.to" class="flex gap-x-4 items-center" target="_blank">
                    <Logo class="h-6 w-6 shrink-0" />
                    <div class="flex flex-col gap-y-1 text-white">
                      <span class="font-bold text-sm text-gray-800 dark:text-gray-200">{{ link.title }}</span>
                      <span class="text-xs text-gray-500 dark:text-gray-400">{{
                        link.description
                      }}</span>
                    </div>
                  </NuxtLink>
                </li>
              </ul>
            </template>
          </AppPopover>
        </div>
        <ul class="justify-center hidden lg:col-span-4 lg:gap-x-8 xl:gap-x-10 lg:flex">
          <li v-for="(link, index) in visibleLinks" :key="index">
            <NuxtLink :to="link._path" :exact="link.exact" :target="link.target" class="text-sm lg:text-base link" :class="{
              'active focus-visible:ring': isActive(link),
              'font-medium u-text-gray-600 hover:u-text-gray-900 focus:u-text-gray-900 active:shadow-inner active:font-semibold':
                !isActive(link),
            }">
              {{ link.title }}
            </NuxtLink>
          </li>
        </ul>
        <div class="flex justify-end">
          <AlgoliaDocSearch v-show="$route.fullPath.startsWith('/docs')"
            class="absolute left-8 bottom-[14px] sm:bottom-0 sm:left-0 sm:mb-0 sm:relative sm:mr-4" />
          <SocialLinks />
        </div>
      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
import type { NavItem } from "@nuxt/content/dist/runtime/types"
import type { Ref, ComputedRef } from "vue"

const route = useRoute()
const { hasScrolledPastNavbar } = useNavbarScroll()

const dropdownLinks = [
  {
    title: "Nuxt.nuxters",
    description: "Are you a Nuxter?",
    to: "https://nuxters.nuxt.com/",
  },
  {
    title: "Nuxt.new",
    description: "Nuxt templates",
    to: "https://nuxt.new",
  },
] as Array<{ title: string; description: string; to: string }>

const links: Ref<NavItem[]> = ref([
  {
    title: "Docs",
    icon: "uil:book-open",
    path: "/docs",
    _path: "/docs",
  },
  {
    title: "Modules",
    icon: "uil:palette",
    _path: "/modules",
  },
  {
    title: "Showcase",
    _path: "/showcase",
    icon: "uil:object-group",
  },
  {
    title: "Enterprise",
    _path: "/enterprise/support",
    path: "/enterprise",
    icon: "uil:globe",
  },
  {
    title: "Blog",
    _path: "/blog",
    path: "/blog",
    icon: "uil:globe",
  },
])

const { open } = useSlideover()

const visibleLinks: ComputedRef<NavItem[]> = computed(() =>
  links.value.filter((link) => !link.hidden)
)

function isActive (link: NavItem) {
  // Workaround for /docs
  return link.exact
    ? route.fullPath === link._path
    : route.fullPath.startsWith(link.path || link._path)
}
</script>

<style scoped>
.link {
  border-radius: 0.25rem;
  line-height: 1.25rem;
  padding: 0.5rem 1rem;
  transition-duration: 0.15s;
  transition-property: color, background-color, border-color,
    text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter,
    backdrop-filter, -webkit-backdrop-filter;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

.link:hover {
  background-color: rgb(244, 244, 245);
}

.link.active {
  @apply font-semibold u-text-gray-900 shadow-inner;
  background-color: rgb(244, 244, 245);
  outline: 2px solid transparent;
  outline-offset: 2px;
}

.dark .link:hover,
.dark .active {
  background-color: rgb(24 24 27);
}
</style>

<style lang="ts" scoped>

css({
  '.app-button': {
    border: 'none',
    padding: '{size.8} {size.2} {size.8} {size.8}',
    marginTop: '-4px',

    marginLeft: '0px',

    '@sm': {
      marginLeft: '8px',
    },

    '@lg': {
      '&:hover': {
        background: '{color.gray.100}',

        '@dark': {
          background: '{color.gray.800}'
        }
      }
    }
  },
})
</style>
