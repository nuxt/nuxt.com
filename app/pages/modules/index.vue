<script setup lang="ts">
import type { Module } from '~/types'
import { joinURL } from 'ufo'

definePageMeta({
  heroBackground: 'opacity-50'
})

const input = useTemplateRef('input')
const el = useTemplateRef<HTMLElement>('el')

const { replaceRoute } = useFilters('modules')
const { fetchList, filteredModules, q, categories, modules, stats, selectedSort, selectedOrder, selectedCategory, sorts } = useModules()

const { data: page } = await useAsyncData('modules-landing', () => queryCollection('landing').path('/modules').first())
if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

const title = page.value.title
const description = page.value.description
const site = useSiteConfig()

useSeoMeta({
  titleTemplate: '%s',
  title,
  description,
  ogDescription: description,
  ogTitle: title,
  ogImage: joinURL(site.url, '/modules-social-card.jpg'),
  twitterImage: joinURL(site.url, '/modules-social-card.jpg')
})

await fetchList()

defineShortcuts({
  '/': () => {
    input.value?.inputRef?.focus()
  }
})

const breakpoints = useBreakpoints({
  sm: 640,
  md: 768,
  lg: 1024
})

const isMobile = breakpoints.smaller('sm')

const ITEMS_PER_PAGE = 9
const SCROLL_THRESHOLD = 450
const displayedModules = ref<Module[]>([])
const isLoading = ref(false)

const { y: scrollY } = useWindowScroll()

const loadMoreModules = () => {
  if (isLoading.value) return

  const currentLength = displayedModules.value.length
  if (currentLength >= filteredModules.value.length) return

  isLoading.value = true

  setTimeout(() => {
    const nextItems = filteredModules.value.slice(
      currentLength,
      currentLength + ITEMS_PER_PAGE
    )
    displayedModules.value.push(...nextItems)
    isLoading.value = false
  }, 300)
}

const initializeModules = () => {
  displayedModules.value = filteredModules.value.slice(0, ITEMS_PER_PAGE * 2)
}

const debouncedLoadMore = useDebounceFn(loadMoreModules, 50)

watch(scrollY, (y) => {
  if (window.innerHeight + y >= document.documentElement.scrollHeight - SCROLL_THRESHOLD) {
    debouncedLoadMore()
  }
})

watch(filteredModules, () => {
  isLoading.value = false
  displayedModules.value = []
  initializeModules()
})

initializeModules()
</script>

<template>
  <UContainer ref="el">
    <LazyModulesMarquee :modules="modules" />

    <UPageHero
      class="z-20 relative pt-24"
      :ui="{
        title: 'text-4xl sm:text-7xl text-balance max-w-4xl mx-auto',
        links: 'max-w-2xl mx-auto'
      }"
    >
      <template #title>
        Build faster with <span class="text-primary">{{ modules.length }}+</span> Nuxt Modules
      </template>

      <template #description>
        Discover our list of modules to supercharge your Nuxt project. Created and maintained by more than {{ stats.contributors.toString() }} people from the Nuxt team and community.
      </template>

      <template #links>
        <div class="flex flex-col w-full gap-3">
          <div class="flex flex-col sm:flex-row w-full gap-2 relative">
            <UInput
              ref="input"
              :model-value="q"
              name="q"
              icon="i-lucide-search"
              placeholder="Search a module..."
              class="w-full"
              size="lg"
              autofocus
              autocomplete="off"
              variant="subtle"
              @update:model-value="replaceRoute('q', $event as string)"
            >
              <template #trailing>
                <UButton
                  v-if="q"
                  color="neutral"
                  variant="link"
                  size="lg"
                  icon="i-lucide-x"
                  @click="replaceRoute('q', '')"
                />
                <UKbd v-else value="/" class="hidden sm:flex" />
              </template>
            </UInput>

            <div v-if="!isMobile" class="flex gap-2 sm:w-auto">
              <USelectMenu
                :model-value="selectedSort"
                :items="sorts"
                size="lg"
                color="neutral"
                class="w-auto"
                variant="outline"
                @update:model-value="replaceRoute('sortBy', $event)"
              />

              <UButton
                :icon="selectedOrder.icon"
                size="lg"
                color="neutral"
                variant="outline"
                @click="replaceRoute('orderBy', selectedOrder.key === 'desc' ? 'asc' : 'desc')"
              >
                <span class="sr-only">Sort by {{ selectedOrder.label }}</span>
              </UButton>
            </div>
          </div>

          <div v-if="isMobile" class="flex gap-2">
            <USelectMenu
              :model-value="selectedCategory"
              :items="categories"
              size="lg"
              color="neutral"
              variant="outline"
              class="flex-1"
              placeholder="Select category"
              @update:model-value="replaceRoute('category', $event)"
            />
            <UButton
              v-if="selectedCategory"
              icon="i-lucide-x"
              size="lg"
              color="neutral"
              variant="outline"
              aria-label="Clear category filter"
              @click="replaceRoute('category', '')"
            />
            <USelectMenu
              :model-value="selectedSort"
              :items="sorts"
              size="lg"
              color="neutral"
              class="w-1/3"
              variant="outline"
              @update:model-value="replaceRoute('sortBy', $event)"
            />
            <UButton
              :icon="selectedOrder.icon"
              size="lg"
              color="neutral"
              variant="outline"
              @click="replaceRoute('orderBy', selectedOrder.key === 'desc' ? 'asc' : 'desc')"
            />
          </div>
        </div>

        <div class="hidden sm:flex mt-6 flex-wrap gap-1.5 justify-center">
          <UButton
            v-for="category in categories"
            :key="category.key"
            v-bind="category"
            color="neutral"
            variant="outline"
            active-color="primary"
            active-variant="subtle"
            size="sm"
          />
        </div>
      </template>
    </UPageHero>

    <UPage id="smooth" class="relative z-20">
      <UPageBody>
        <UPageGrid v-if="filteredModules?.length" class="lg:grid-cols-2 xl:grid-cols-3">
          <ModuleItem v-for="(module, index) in displayedModules" :key="index" :module="module" />

          <template v-if="isLoading">
            <div v-for="n in ITEMS_PER_PAGE" :key="n" class="flex flex-col gap-4 p-4 rounded-lg border border-default">
              <div class="flex items-center gap-3">
                <USkeleton class="h-8 w-8 rounded" />
              </div>
              <USkeleton class="h-4 w-3/4" />
              <USkeleton class="h-4 w-full" />
              <div class="flex gap-2">
                <USkeleton class="h-6 w-16" />
                <USkeleton class="h-6 w-16" />
              </div>
            </div>
          </template>
        </UPageGrid>

        <EmptyCard v-else :label="`There is no module found for ${q} yet. Become the first one to create it!`">
          <UButton
            label="Contribute on GitHub"
            color="neutral"
            to="https://github.com/nuxt/modules"
            target="_blank"
            size="md"
            @click="$router.replace({ query: {} })"
          />
          <UButton to="/docs/guide/going-further/modules" color="neutral" size="md" label="How to create a module?" />
        </EmptyCard>
      </UPageBody>
    </UPage>
  </UContainer>
</template>
