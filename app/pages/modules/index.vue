<script setup lang="ts">
definePageMeta({
  heroBackground: 'opacity-70'
})

const input = useTemplateRef('input')

const { replaceRoute } = useFilters('modules')
const { fetchList, filteredModules, q, categories, stats, selectedOrder, sorts, selectedSort } = useModules()

const { data: page } = await useAsyncData('modules-landing', () => queryCollection('landing').path('/modules').first())
if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

const title = page.value?.title || page.value.title
const description = page.value?.description || page.value.description
useSeoMeta({
  titleTemplate: '%s',
  title,
  description,
  ogDescription: description,
  ogTitle: title
})
defineOgImageComponent('Docs')

await fetchList()

defineShortcuts({
  '/': () => {
    input.value?.inputRef?.focus()
  }
})
</script>

<template>
  <UContainer>
    <UPageHero
      v-bind="page"
      class="z-30"
      :ui="{
        container: 'py-10 sm:py-20 lg:py-20 px-0 sm:px-0 lg:px-0',
        title: 'sm:text-5xl'
      }"
    >
      <template #description>
        <p>{{ page.description }}</p>
        <div class="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 justify-center">
          <div class="flex items-center gap-1.5">
            <UIcon name="i-lucide-circle-user" class="size-4 shrink-0 text-(--ui-text-muted)" />
            <span class="text-base font-medium">{{ formatNumber(stats.maintainers) }} Maintainers</span>
          </div>
          <div class="flex items-center gap-1.5">
            <UIcon name="i-lucide-users" class="size-4 shrink-0 text-(--ui-text-muted)" />
            <span class="text-base font-medium">+{{ formatNumber(stats.contributors) }} Contributors</span>
          </div>
          <div class="flex items-center gap-1.5">
            <UIcon name="i-lucide-puzzle" class="size-4 shrink-0 text-(--ui-text-muted)" />
            <span class="text-base font-medium">{{ formatNumber(stats.modules) }} Modules</span>
          </div>
        </div>
      </template>
    </UPageHero>

    <UPage id="smooth" class="pt-20 -mt-20">
      <template #left>
        <UPageAside class="space-y-4">
          <UInput
            ref="input"
            icon="i-lucide-search"
            :model-value="q"
            name="q"
            placeholder="Search..."
            autocomplete="off"
            class="mb-2"
            @update:model-value="replaceRoute('q', $event)"
          >
            <template #trailing>
              <UButton
                v-if="q"
                color="neutral"
                variant="link"
                size="xs"
                icon="i-ph-x"
                @click="replaceRoute('q', '')"
              />
              <UKbd v-else value="/" />
            </template>
          </UInput>
          <UButtonGroup class="w-full mb-4">
            <USelectMenu
              :model-value="selectedSort"
              :items="sorts"
              size="md"
              color="neutral"
              class="w-full"
              variant="outline"
              @update:model-value="replaceRoute('sortBy', $event)"
            />
            <UButton
              :icon="selectedOrder.icon"
              size="md"
              color="neutral"
              variant="outline"
              @click="replaceRoute('orderBy', selectedOrder.key === 'desc' ? 'asc' : 'desc')"
            />
          </UButtonGroup>
          <UContentNavigation :navigation="[{ title: 'Categories', children: categories }]" highlight />
        </UPageAside>
      </template>

      <UPageBody class="lg:pl-8">
        <div class="lg:hidden mb-6 flex items-center gap-2">
          <UInput
            ref="inputRef"
            type="search"
            :model-value="q"
            name="q"
            icon="i-ph-magnifying-glass"
            placeholder="Search a module..."
            class="w-full"
            size="sm"
            autocomplete="off"
            variant="outline"
            @update:model-value="replaceRoute('q', $event)"
          />
          <UButtonGroup>
            <USelectMenu
              :model-value="selectedSort"
              :options="sorts"
              size="md"
              color="neutral"
              variant="outline"
              @update:model-value="replaceRoute('sortBy', $event)"
            />
            <UButton
              :icon="selectedOrder.icon"
              size="md"
              color="neutral"
              variant="outline"
              @click="replaceRoute('orderBy', selectedOrder.key === 'desc' ? 'asc' : 'desc')"
            />
          </UButtonGroup>
        </div>
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

<style lang="postcss">
.group:hover .shine {
  text-decoration: none;
  display: inline-block;
  mask-image: linear-gradient(-75deg, rgba(255,255,255,.8) 30%, #fff 50%, rgba(255,255,255,.8) 70%);
  mask-size: 200%;
  animation: shine 2s linear infinite;
}

@keyframes shine {
  from { -webkit-mask-position: 150%; }
  to { -webkit-mask-position: -50%; }
}
</style>
