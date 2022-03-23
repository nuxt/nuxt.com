<template>
  <div class="h-screen flex">
    <TransitionRoot as="template" :show="mobileMenuOpen">
      <Dialog as="div" class="fixed inset-0 flex z-40 lg:hidden" @close="mobileMenuOpen = false">
        <TransitionChild
          as="template"
          enter="transition-opacity ease-linear duration-300"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="transition-opacity ease-linear duration-300"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <DialogOverlay class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </TransitionChild>
        <TransitionChild
          as="template"
          enter="transition ease-in-out duration-300 transform"
          enter-from="-translate-x-full"
          enter-to="translate-x-0"
          leave="transition ease-in-out duration-300 transform"
          leave-from="translate-x-0"
          leave-to="-translate-x-full"
        >
          <div class="relative flex-1 flex flex-col max-w-xs w-full u-bg-white focus:outline-none">
            <TransitionChild
              as="template"
              enter="ease-in-out duration-300"
              enter-from="opacity-0"
              enter-to="opacity-100"
              leave="ease-in-out duration-300"
              leave-from="opacity-100"
              leave-to="opacity-0"
            >
              <div class="absolute top-0 right-0 -mr-12 pt-4">
                <button type="button" class="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white" @click="mobileMenuOpen = false">
                  <span class="sr-only">Close sidebar</span>
                  <UIcon name="heroicons-outline:x" class="h-6 w-6 text-white" aria-hidden="true" />
                </button>
              </div>
            </TransitionChild>

            <div class="pt-5 pb-4">
              <div class="flex-shrink-0 flex items-center px-4">
                <NuxtLink :to="{ name: '@team-projects' }" class="inline-flex">
                  <UAvatar :src="`https://github.com/${project.repository.owner}.png`" :alt="project.name" size="sm" class="flex-shrink-0" />
                </NuxtLink>
              </div>

              <UVerticalNavigation :links="links" class="mt-5 px-2" @click="mobileMenuOpen = false" />
            </div>
            <div class="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div class="flex items-center">
                <UAvatar :src="user.avatar" :alt="user.username" />
                <div class="ml-3">
                  <p class="text-base font-medium u-text-gray-700 group-hover:u-text-gray-900">
                    {{ user.name }}
                  </p>
                  <p class="text-sm font-medium u-text-gray-500 group-hover:u-text-gray-700">
                    {{ user.username }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </TransitionChild>
        <div class="flex-shrink-0 w-14" aria-hidden="true" />
      </Dialog>
    </TransitionRoot>

    <div class="hidden lg:flex lg:flex-shrink-0">
      <div class="flex flex-col w-16">
        <div class="flex-1 flex flex-col min-h-0 overflow-y-auto u-bg-white border-r u-border-gray-200">
          <div class="flex-1">
            <div class="py-4 flex items-center justify-center">
              <NuxtLink :to="{ name: '@team-projects' }" class="inline-flex">
                <UAvatar :src="`https://github.com/${project.repository.owner}.png`" :alt="project.name" size="sm" class="flex-shrink-0" />
              </NuxtLink>
            </div>
            <div aria-label="Sidebar" class="pb-6 flex flex-col items-center space-y-3">
              <UVerticalNavigation :links="linksWithoutLabel" spacing-class="p-2" badge-base-class="absolute rounded-full leading-none w-4 h-4 u-bg-gray-900 u-text-white flex items-center justify-center font-semibold z-[1] text-[11px] -top-1 -right-1" badge-active-class badge-inactive-class />
            </div>
          </div>
          <div class="flex-shrink-0 flex flex-col items-center space-y-3 pb-5">
            <ProfileDropdown class="mx-auto" />
          </div>
        </div>
      </div>
    </div>

    <div class="flex-1 min-w-0 flex flex-col overflow-hidden">
      <div class="lg:hidden">
        <div class="u-bg-white py-2 flex items-center justify-between px-4 sm:px-6 h-16 border-b u-border-gray-200">
          <NuxtLink :to="{ name: '@team-projects' }" class="inline-flex">
            <UAvatar :src="`https://github.com/${project.repository.owner}.png`" :alt="project.name" size="sm" class="flex-shrink-0" />
          </NuxtLink>
          <div>
            <UButton variant="transparent" icon="heroicons-outline:menu" class="-mr-1" @click="mobileMenuOpen = true" />
          </div>
        </div>
      </div>

      <slot />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import type { Ref } from 'vue'
import { omit } from 'lodash-es'
import { Dialog, DialogOverlay, TransitionChild, TransitionRoot } from '@headlessui/vue'
import { User } from '~/types'

const props = defineProps({
  project: {
    type: Object,
    required: true
  },
  links: {
    type: Array,
    default: () => []
  }
})

const user = useStrapiUser() as Ref<User>

const linksWithoutLabel = computed(() => props.links.map(link => omit(link, 'label')))

const mobileMenuOpen = ref(false)
</script>
