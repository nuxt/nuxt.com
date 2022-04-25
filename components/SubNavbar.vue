<template>
  <div
    class="z-[5] sticky top-0 hidden lg:block border-t border-transparent"
    :class="hasScrolledPastSubNavbar ? 'backdrop-blur-md bg-white/75 dark:bg-black/75 shadow shadow-gray-200 dark:shadow-gray-900' : 'u-border-gray-200'"
  >
    <UContainer padded>
      <div class="relative grid items-center justify-between h-16 grid-cols-2 gap-3 sm:grid-cols-6">
        <div class="flex items-center justify-start">
          <Logo class="h-4 transition-all" :class="[hasScrolledPastSubNavbar ? 'w-auto mr-3' : 'w-0']" />

          <slot name="left">
            <component :is="!!to ? 'NuxtLink' : 'p'" v-if="title" :to="to" class="font-semibold u-text-gray-900 focus:outline-none" tabindex="-1">
              {{ title }}
            </component>
          </slot>
        </div>

        <div class="flex justify-center col-span-4 gap-x-8">
          <ULink
            v-for="(link, index) in links"
            :key="index"
            :to="link.slug"
            class="text-sm focus:outline-none"
            :class="{
              'u-text-gray-900 font-semibold': isActive(link),
              'font-medium u-text-gray-500 hover:u-text-gray-900 focus:u-text-gray-900': !isActive(link),
            }"
          >
            {{ link.title }}
          </ULink>
        </div>

        <div class="flex gap-3 justify-end">
          <slot name="right" />
        </div>
      </div>
    </UContainer>
  </div>
</template>

<script setup lang="ts">
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
    type: Array,
    default: () => []
  }
})

const route = useRoute()
const { hasScrolledPastSubNavbar } = useNavbarScroll()

function isActive (link) {
  return link.exact ? route.path === link.slug : route.path.startsWith(link.slug)
}
</script>
