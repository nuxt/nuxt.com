<script setup lang="ts">
definePageMeta({
  heroBackground: 'opacity-70'
})

const inputRef = ref()

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
    inputRef.value.input.focus()
  }
})

const { copy } = useClipboard()
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
            <UIcon name="i-ph-user-circle-fill" class="w-4 h-4 flex-shrink-0 dark:text-gray-200 text-gray-700" />
            <span class="text-sm font-medium">{{ formatNumber(stats.maintainers) }} Maintainers</span>
          </div>
          <div class="flex items-center gap-1.5">
            <UIcon name="i-ph-users-three-fill" class="w-4 h-4 flex-shrink-0 dark:text-gray-200 text-gray-700" />
            <span class="text-sm font-medium">{{ formatNumber(stats.contributors) }} Contributors</span>
          </div>
          <div class="flex items-center gap-1.5">
            <UIcon name="i-ph-puzzle-piece-fill" class="w-4 h-4 flex-shrink-0 dark:text-gray-200 text-gray-700" />
            <span class="text-sm font-medium">{{ formatNumber(stats.modules) }} Modules</span>
          </div>
        </div>
      </template>
    </UPageHero>

    <UPage id="smooth" class="pt-20 -mt-20">
      <template #left>
        <UPageAside>
          <UInput
            ref="inputRef"
            :model-value="q"
            name="q"
            icon="i-ph-magnifying-glass"
            placeholder="Search..."
            class="w-full mb-2"
            size="md"
            variant="outline"
            autocomplete="off"
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
              <UKbd v-else>
                /
              </UKbd>
            </template>
          </UInput>
          <UButtonGroup class="mb-4 w-full">
            <USelectMenu
              :model-value="selectedSort"
              :options="sorts"
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
        <UPageGrid v-if="filteredModules?.length">
          <UPageCard
            v-for="(module, index) in filteredModules"
            :key="index"
            :to="`/modules/${module.name}`"
            :title="module.npm"
            class="flex flex-col overflow-hidden group"
            :ui="{
              leading: 'mb-2 bg-transparent',
              container: 'p-4 sm:p-4'
            }"
          >
            <template #leading>
              <UAvatar
                :src="moduleImage(module.icon)"
                :icon="moduleIcon(module.category)"
                :alt="module.name"
                size="xs"
                class="pointer-events-none rounded-md bg-transparent"
              />
            </template>

            <template #description>
              <span class="line-clamp-2 text-(--ui-text-muted) text-sm">{{ module.description }}</span>
            </template>

            <UBadge
              v-if="module.type === 'official'"
              class="space-x-1 shine text-sm items-center justify-center pointer-events-none absolute top-4 right-4"
              size="xs"
              variant="outline"
            >
              <span>Official</span>
            </UBadge>

            <UBadge
              v-if="module.sponsor"
              class="space-x-1 shine text-sm items-center justitfy-center pointer-events-none absolute top-4 right-4"
              size="xs"
              color="pink"
            >
              <span>Sponsor</span>
            </UBadge>

            <template #footer>
              <USeparator type="dashed" class="mb-4" />
              <div class="flex items-center justify-between gap-3 -my-1 text-gray-600 dark:text-gray-300">
                <div class="flex items-center gap-3">
                  <UTooltip text="Monthly NPM Downloads">
                    <NuxtLink
                      class="flex items-center gap-1 hover:text-gray-900 hover:dark:text-white"
                      :to="`https://npm.chart.dev/${module.npm}`"
                      target="_blank"
                    >
                      <UIcon name="i-ph-arrow-circle-down" class="w-4 h-4 flex-shrink-0" />
                      <span class="text-sm font-medium">{{ formatNumber(module.stats.downloads) }}</span>
                    </NuxtLink>
                  </UTooltip>

                  <UTooltip text="GitHub Stars">
                    <NuxtLink
                      class="flex items-center gap-1 hover:text-gray-900 hover:dark:text-white"
                      :to="`https://github.com/${module.repo}`"
                      target="_blank"
                    >
                      <UIcon name="i-ph-star" class="w-4 h-4 flex-shrink-0" />
                      <span class="text-sm font-medium">{{ formatNumber(module.stats.stars || 0) }}</span>
                    </NuxtLink>
                  </UTooltip>
                </div>

                <UTooltip
                  :text="`Copy install command`"
                >
                  <UButton
                    icon="i-ph-terminal"
                    color="neutral"
                    size="xs"
                    variant="outline"
                    @click="copy(`npx nuxi@latest module add ${module.name}`, { title: 'Command copied to clipboard:', description: `npx nuxi@latest module add ${module.name}` })"
                  />
                </UTooltip>
              </div>
            </template>
          </UPageCard>
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
