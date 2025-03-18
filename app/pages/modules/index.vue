<script setup lang="ts">
definePageMeta({
  heroBackground: 'opacity-50'
})

const input = useTemplateRef('input')

const { replaceRoute } = useFilters('modules')
const { fetchList, filteredModules, q, categories, modules, stats, selectedSort, selectedOrder, selectedCategory, sorts } = useModules()

const { data: page } = await useAsyncData('modules-landing', () => queryCollection('landing').path('/modules').first())
if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

const title = page.value.title
const description = page.value.description

useSeoMeta({
  titleTemplate: '%s',
  title,
  description,
  ogDescription: description,
  ogTitle: title
})
defineOgImageComponent('Docs', {
  title,
  description
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
</script>

<template>
  <UContainer>
    <LazyModulesMarquee :modules="modules" />

    <UPageHero
      class="z-20 relative pt-24"
      :ui="{
        title: 'text-4xl sm:text-7xl text-balance max-w-4xl mx-auto',
        links: 'max-w-2xl mx-auto'
      }"
    >
      <template #title>
        Build faster with <span class="text-(--ui-primary)">{{ modules.length }}+</span> Nuxt Modules
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
                @update:model-value="replaceRoute('sortBy', $event as string)"
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

          <div v-if="isMobile" class="flex gap-2">
            <USelectMenu
              :model-value="selectedCategory"
              :items="categories"
              size="lg"
              color="neutral"
              variant="outline"
              class="flex-1"
              placeholder="Select category"
              @update:model-value="replaceRoute('category', $event as string)"
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
              @update:model-value="replaceRoute('sortBy', $event as string)"
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
          <ModuleItem v-for="(module, index) in filteredModules" :key="index" :module="module" />
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
