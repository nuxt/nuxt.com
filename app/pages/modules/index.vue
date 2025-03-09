<script setup lang="ts">
definePageMeta({
  heroBackground: 'opacity-50'
})

const input = useTemplateRef('input')

const { replaceRoute } = useFilters('modules')
const { fetchList, filteredModules, q, categories, modules, stats, selectedSort, selectedOrder, sorts, orders } = useModules()

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

const marqueeModulesData = useState('marqueeModules', () => [])

const getRandomDelay = (rowIndex, index) => {
  const baseDelay = (rowIndex * 0.3) + (index * 0.05)
  const randomOffset = ((rowIndex * 13) + index) % 10 * 0.1
  return baseDelay + randomOffset
}

const initMarqueeModules = () => {
  if (marqueeModulesData.value.length) return

  const allModules = [...filteredModules.value]
  const limitedModules = shuffleArray(allModules).slice(0, 50)

  const row1 = shuffleArray(limitedModules)
  const row2 = shuffleArray(limitedModules)
  const row3 = shuffleArray(limitedModules)

  marqueeModulesData.value = [row1, row2, row3]
}

watch(() => filteredModules.value, (newVal) => {
  if (newVal?.length && !marqueeModulesData.value.length) {
    initMarqueeModules()
  }
}, { immediate: true })

defineShortcuts({
  '/': () => {
    input.value?.inputRef?.focus()
  }
})
</script>

<template>
  <UContainer>
    <div class="absolute inset-0 overflow-hidden">
      <div class="flex flex-col justify-between pt-20">
        <UPageMarquee
          v-for="(row, rowIndex) in marqueeModulesData"
          :key="rowIndex"
          :reverse="rowIndex % 2 === 1"
          :overlay="false"
          :ui="{
            root: `[--gap:--spacing(4)] [--duration:400s]`
          }"
          class="mb-(--gap)"
        >
          <Motion
            v-for="(module, index) in row"
            :key="`${rowIndex}-${index}`"
            :initial="{
              scale: 0.5,
              opacity: 0,
              filter: 'blur(10px)'
            }"
            :animate="{
              scale: 1,
              opacity: 1,
              filter: 'blur(0px)'
            }"
            :transition="{
              delay: getRandomDelay(rowIndex, index)
            }"
            class="flex items-center justify-center size-16 rounded-lg bg-(--ui-bg-muted) p-2 border border-(--ui-border)"
          >
            <UAvatar
              :src="moduleImage(module.icon)"
              :icon="moduleIcon(module.category)"
              :alt="module.name"
              size="lg"
              class="rounded-none bg-transparent"
            />
          </Motion>
        </UPageMarquee>
      </div>

      <div class="absolute left-0 top-0 bottom-0 w-1/2 z-10 bg-linear-to-bl from-(--ui-bg)/10 to-(--ui-bg) to-50%" />
      <div class="absolute right-0 top-0 bottom-0 w-1/2 z-10 bg-linear-to-br from-(--ui-bg)/10 to-(--ui-bg) to-50%" />
      <div class="absolute top-0 left-0 right-0 size-full z-10 bg-linear-to-t from-(--ui-bg) to-(--ui-bg)/5" />
    </div>

    <UPageHero
      v-bind="page"
      class="z-20 relative mt-32"
      :ui="{
        title: 'text-balance',
        links: 'max-w-2xl mx-auto'
      }"
    >
      <template #title>
        Build faster with <span class="text-(--ui-primary)">{{ modules.length }}+</span> Nuxt Modules
      </template>

      <template #description>
        {{ description.replace('%s', stats.contributors.toLocaleString()) }}
      </template>

      <template #links>
        <div class="flex sm:flex-row flex-col w-full items-center gap-2">
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
              <UKbd v-else value="/" />
            </template>
          </UInput>
          <UButtonGroup>
            <USelectMenu
              :model-value="selectedSort"
              :items="sorts"
              size="lg"
              color="neutral"
              class="w-full"
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
          </UButtonGroup>
        </div>

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
