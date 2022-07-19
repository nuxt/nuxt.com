<template>
  <div class="py-6 overflow-hidden sm:py-12">
    <div class="mx-auto sm:px-6 lg:px-8 px-4 max-w-7xl">
      <div class="flex gap-20 justify-between items-center mb-16">
        <div class="flex gap-11 items-center">
          <ModulesListItemCover :icon="module.icon" :alt="module.name" icon-class="w-auto h-36" />
          <div>
            <div class="flex gap-3 items-center">
              <h1 class="text-3xl capitalize font-semibold u-text-gray-900">
                {{ module.name }}
              </h1>
              <NuxtLink :to="module.website" target="_blank">
                <div class="flex items-center">
                  <span class="u-text-gray-400 mr-2">Go to documentation</span>
                  <UIcon name="uil:external-link-alt" class="u-text-gray-500" />
                </div>
              </NuxtLink>
            </div>
            <p class="u-text-gray-500 my-1 text-xl">
              {{ module.description }}
            </p>
            <div class="flex gap-3 items-center u-text-gray-500">
              <UAvatarGroup :group="maintainers" size="xs" :max="4" />
              <span>{{ maintainers.length }} Maintainer{{ maintainers.length > 1 ? 's' : '' }}</span>
              <span>-</span>
              <div class="flex items-center gap-1.5">
                <UIcon name="heroicons-outline:download" class="w-4 h-4" />
                <span>{{ formatNumber(module.downloads) }} installs</span>
              </div>
              <span>-</span>
              <div class="flex items-center gap-1.5">
                <UIcon name="heroicons-outline:star" class="w-4 h-4" />
                <span>{{ formatNumber(module.stars) }} stars</span>
              </div>
            </div>
          </div>
        </div>
        <div>
          <div class="flex items-center gap-5 py-3 px-4 u-bg-gray-800 u-text-white rounded-md">
            <span class="whitespace-nowrap">yarn add {{ module.name }}</span>
            <CopyButton
              base-class="font-mono font-semibold leading-none copy focus:outline-none text-warmgray-600 dark:text-warmgray-400 bg-warmgray-200 dark:bg-warmgray-700"
              icon-class="w-4 h-4"
              :content="`yarn add ${module.name}`"
            />
          </div>
        </div>
      </div>
      <UPills :links="links" />
      <NuxtPage />
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatNumber } from '~/utils'

const { fetchOne, module } = useModules()
const route = useRoute()

const links = [
  { label: 'Overview', to: `/modules/${route.params.slug}` },
  { label: 'Changelog', to: `/modules/${route.params.slug}/changelog` }
]

await fetchOne(route.params.slug as string)

// Computed
const maintainers = computed(() => module.value.maintainers.map(m => ({ src: `https://avatars.githubusercontent.com/${m.github}`, alt: m.name })))

</script>
