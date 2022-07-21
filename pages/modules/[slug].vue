<template>
  <UContainer padded class="pt-16">
    <div class="flex gap-20 justify-between items-center mb-16">
      <div class="flex gap-11 items-center">
        <div class="flex justify-center items-center border rounded-md u-bg-gray-100 relative w-36 h-36">
          <ModulesListItemCover :icon="module.icon" :alt="module.name" />
          <div class="rounded-full bg-white absolute -right-5 -bottom-5 h-12 w-12" />
          <div class="flex items-center justify-center rounded-full bg-overlay absolute -right-5 -bottom-5 h-12 w-12">
            <UIcon name="uil:medal" class="h-5 w-5" />
          </div>
        </div>
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
          <p class="u-text-gray-500 mt-1 text-xl">
            {{ module.description }}
          </p>
          <div class="flex gap-3 items-center mt-4 u-text-gray-500">
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
          <span v-if="module.npm" class="whitespace-nowrap">yarn add {{ module.npm }}</span>
          <CopyButton
            base-class="font-mono font-semibold leading-none copy focus:outline-none text-warmgray-600 dark:text-warmgray-400 bg-warmgray-200 dark:bg-warmgray-700"
            icon-class="w-4 h-4"
            :content="`yarn add ${module.name}`"
          />
        </div>
      </div>
    </div>
    <UPills base-class="px-14 py-2 mb-8 font-medium text-sm rounded-md" :links="links" />
    <NuxtPage />
  </Ucontainer>
</template>

<script setup lang="ts">
import { formatNumber } from '~/utils'

const { fetchOne, module } = useModules()
const route = useRoute()

const links = [
  { label: 'Overview', to: `/modules/${route.params.slug}`, exact: true },
  { label: 'Changelog', to: `/modules/${route.params.slug}/changelog`, exact: true }
]

await fetchOne(route.params.slug as string)

// Computed
const maintainers = computed(() => module.value.maintainers.map(m => ({ src: `https://avatars.githubusercontent.com/${m.github}`, alt: m.name })))

</script>

<style scoped>
.bg-overlay {
  background: linear-gradient(67.12deg, rgba(0, 220, 130, 0.3) 14.85%, rgba(54, 228, 218, 0.3) 67.04%, rgba(0, 71, 225, 0.3) 119.23%);
}

</style>
