<script setup lang="ts">
definePageMeta({
  heroBackground: 'opacity-50'
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

const shuffleArray = (array) => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

const marqueeModules = computed(() => {
  if (!filteredModules.value?.length) return []

  const row1 = shuffleArray(filteredModules.value)
  const row2 = shuffleArray(filteredModules.value)
  const row3 = shuffleArray(filteredModules.value)

  return [row1, row2, row3]
})

defineShortcuts({
  '/': () => {
    input.value?.inputRef?.focus()
  }
})
</script>

<template>
  <UContainer>
    <div class="overflow-hidden absolute inset-0 mt-20">
      <UPageMarquee
        v-for="(row, rowIndex) in marqueeModules"
        :key="rowIndex"
        :overlay="false"
        :reverse="rowIndex % 2 === 1"
        :ui="{
          root: `[--gap:--spacing(1)] [--duration:400s]`
        }"
        class="mb-2"
      >
        <div
          v-for="(module, index) in row"
          :key="`${rowIndex}-${index}`"
          class="flex items-center justify-center size-16 mx-2 rounded-lg bg-(--ui-bg-muted) p-2 shrink-0"
        >
          <UAvatar
            :src="moduleImage(module.icon)"
            :icon="moduleIcon(module.category)"
            :alt="module.name"
            size="lg"
            class="pointer-events-none rounded-md bg-transparent"
          />
        </div>
      </UPageMarquee>
    </div>

    <UPageHero
      v-bind="page"
      class="z-10 relative"
      :ui="{
        container: '!pb-16',
        title: 'z-30',
        description: 'z-30 max-w-3xl mx-auto',
        links: 'z-30 max-w-2xl mx-auto'
      }"
    >
      <template #description>
        <p>{{ page.description }}</p>

        <!-- <div class="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 justify-center">
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
        </div> -->
      </template>

      <template #links>
        <UInput
          ref="input"
          type="search"
          :model-value="q"
          name="q"
          icon="i-lucide-search"
          placeholder="Search a module..."
          class="w-full"
          size="lg"
          autocomplete="off"
          variant="subtle"
          @update:model-value="replaceRoute('q', $event)"
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
            <UKbd v-else value="/" />
          </template>
        </UInput>
        <!-- <div class="flex items-center gap-2">
          <UButton v-for="link in page.links" :key="link.to" v-bind="link" />
        </div> -->
        <div class="mt-6 flex flex-wrap gap-1.5 justify-center">
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

    <UPage id="smooth" class="pt-20 -mt-20">
      <UPageBody>
        <!-- <div class="mb-6 flex items-center gap-2">
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
        </div> -->
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
