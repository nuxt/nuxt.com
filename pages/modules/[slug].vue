<template>
  <div>
    <UContainer padded class="pt-16">
      <div class="flex flex-col lg:flex-row gap-8 justify-between items-center mb-8 lg:mb-16">
        <div class="flex flex-col md:flex-row gap-8 md:gap-12 items-center">
          <div class="relative border u-border-gray-100 rounded-md u-bg-gray-50">
            <div class="flex justify-center items-center w-36 h-36">
              <ModulesListItemCover :icon="module.icon" icon-class="w-auto h-20" :alt="module.name" />
              <div v-if="module.type === 'official'">
                <div class="rounded-full bg-white absolute -right-5 -bottom-5 h-12 w-12" />
                <div class="flex items-center justify-center rounded-full bg-gradient-to-l from-green-400/30 to-teal-400/30 absolute -right-5 -bottom-5 h-12 w-12">
                  <Icon name="uil:medal" class="h-5 w-5 text-gray-900" />
                </div>
              </div>
            </div>
          </div>
          <div>
            <div class="flex flex-col md:flex-row gap-3 items-center md:items-end">
              <h2 class="text-3xl capitalize font-semibold u-text-gray-900">
                {{ module.name }}
              </h2>

              <a :href="module.website" target="_blank" class="group flex items-center mb-3 md:mb-1">
                <span class="u-text-gray-400 group-hover:u-text-gray-500 mr-2">Go to documentation</span>
                <Icon name="uil:external-link-alt" class="u-text-gray-500" />
              </a>
            </div>
            <p class="u-text-gray-500 mt-1 text-xl text-center md:text-left md:max-w-2xl">
              {{ module.description }}
            </p>
            <div class="flex items-center justify-center md:justify-start gap-1.5 mt-4 u-text-gray-500">
              <NuxtLink :href="module.github" target="_blank" class="flex items-center gap-1.5">
                <UAvatarGroup :group="maintainers" size="xxs" :max="4" />
                <span>{{ maintainers.length }} maintainer{{ maintainers.length > 1 ? 's' : '' }}</span>
              </NuxtLink>
              <div class="hidden md:block">
                -
              </div>
              <NuxtLink :href="`https://npmjs.com/package/${module.npm}`" target="_blank" class="flex items-center gap-1.5">
                <Icon name="uil:download-alt" class="w-4 h-4" />
                <span>{{ formatNumber(module.downloads) }} installs</span>
              </NuxtLink>
              <div class="hidden md:block">
                -
              </div>
              <NuxtLink :href="module.github" target="_blank" class="flex items-center gap-1.5">
                <Icon name="uil:star" class="w-4 h-4" />
                <span>{{ formatNumber(module.stars) }} stars</span>
              </NuxtLink>
            </div>
          </div>
        </div>
        <div>
          <AppButton
            class="module-button"
            :label="`yarn add ${module.npm}`"
            size="lg"
            :trailing-icon="copyIcon"
            truncate
            @click="copyToClipboard(`yarn add ${module.npm}`)"
          />
        </div>
      </div>
      <div class="flex justify-center md:justify-start mb-4">
        <UPills base-class="px-8 md:px-14 py-2 font-medium text-sm rounded-md" :links="links" />
      </div>
    </UContainer>

    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  documentDriven: false
})
const { fetchOne, module } = useModules()
const route = useRoute()
const { $clipboard } = useNuxtApp()

const links: {label: string, to: string, exact: boolean}[] = [
  { label: 'Overview', to: `/modules/${route.params.slug}`, exact: true },
  { label: 'Changelog', to: `/modules/${route.params.slug}/changelog`, exact: true }
]

const copyIcon = ref('uil:copy')

await fetchOne(route.params.slug as string)

// Computed
const maintainers = computed(() => module.value.maintainers.map(m => ({ src: `https://avatars.githubusercontent.com/${m.github}`, alt: m.name })))

const copyToClipboard = (content: string) => {
  $clipboard.copy(content, { title: 'Command copied to clipboard!' })

  copyIcon.value = 'uil:check'
  window.setTimeout(() => {
    copyIcon.value = 'uil:copy'
  }, 2000)
}

useHead({
  title: capitalize(module.value.name) + ' Module',
  meta: [
    { name: 'og:title', content: capitalize(module.value.name) + ' Module' },
    { name: 'description', content: module.value.description },
    { name: 'og:description', content: module.value.description }
  ]
})
</script>

<style lang="postcss">
.module-button {
  @apply bg-gray-800 dark:bg-white
}
</style>
