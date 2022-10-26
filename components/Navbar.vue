<template>
  <header
    class="sticky top-0 z-30 lg:relative transition-all duration-[0.4s] ease"
    :class="{ 'backdrop-blur-md bg-white/75 dark:bg-black/75 lg:!bg-transparent': hasScrolledPastNavbar }"
  >
    <NavbarDialog v-model="isOpen" :links="links" />

    <UContainer padded class="relative">
      <nav id="main-nav" class="grid items-center h-16 grid-cols-6 gap-3 lg:h-20 lg:justify-center" aria-label="Primary Navigation">
        <div class="lg:hidden">
          <button @click="isOpen = true">
            <Icon name="uil:bars" class="flex-shrink-0 w-6 h-6" />
          </button>
        </div>

        <div class="flex justify-center col-span-4 lg:col-span-1 lg:justify-start">
          <NuxtLink to="/" class="block u-text-black" @click.right="$router.push('/design-kit')">
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
              class="text-sm lg:text-base link"
              :class="{
                'font-semibold u-text-gray-900': isActive(link),
                'font-medium u-text-gray-500 hover:u-text-gray-900 focus:u-text-gray-900': !isActive(link),
              }"
            >
              {{ link.title }}
            </NuxtLink>
          </li>
        </ul>
        <SocialLinks />
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

<style scoped>
.link {
  border-radius: .25rem;
  line-height: 1.25rem;
  padding: 0.5rem 1rem;
  transition-duration: .15s;
  transition-property: color,background-color,border-color,text-decoration-color,fill,stroke,opacity,box-shadow,transform,filter,backdrop-filter,-webkit-backdrop-filter;
  transition-timing-function: cubic-bezier(.4,0,.2,1);
}

.link:hover, .link.router-link-exact-active {
  background-color: rgb(244 244 245);
  outline: 2px solid transparent;
  outline-offset: 2px;
}

.dark .link:hover, .link.router-link-exact-active {
  background-color: rgb(24 24 27);
}

</style>
