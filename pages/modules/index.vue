<script setup lang="ts">
definePageMeta({
  heroBackground: 'opacity-70'
})

const inputRef = ref()

const route = useRoute()
const { replaceRoute } = useFilters('modules')
const { fetchList, filteredModules, q, categories, selectedOrder, sorts, selectedSort } = useModules()

const { data: page } = await useAsyncData(route.path, () => queryContent(route.path).findOne())

const links = [{
  icon: 'i-ph-book-open',
  label: 'Module Author Guide',
  to: '/docs/guide/going-further/modules'
}, {
  icon: 'i-ph-plus-circle',
  label: 'List your module',
  to: 'https://github.com/nuxt/modules#addupdate-a-module',
  target: '_blank'
}]

const title = page.value.head?.title || page.value.title
const description = page.value.head?.description || page.value.description
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

const { copy } = useCopyToClipboard()
</script>

<template>
  <UContainer>
    <UPageHero v-bind="page" class="z-30">
      <div class="lg:pl-10">
        <UPageGrid :ui="{ wrapper: 'grid-cols-2 sm:grid-cols-2 xl:grid-cols-2 gap-4' }">
          <UPageCard
            to="https://image.nuxt.com/?utm_source=nuxt_website&utm_medium=modules"
            target="_blank"
            description="Plug-and-play image optimization."
          >
            <template #title>
              Nuxt Image
              <UIcon name="i-ph-medal" class="h-4 w-4 text-primary pointer-events-none" />
            </template>
          </UPageCard>
          <UPageCard
            to="https://content.nuxt.com/?utm_source=nuxt_website&utm_medium=modules"
            target="_blank"
            title="Nuxt Content"
            description="Git-based CMS with Markdown support."
          >
            <template #title>
              Nuxt Content
              <UIcon name="i-ph-medal" class="h-4 w-4 text-primary pointer-events-none" />
            </template>
          </UPageCard>
          <UPageCard
            to="https://devtools.nuxt.com/?utm_source=nuxt_website&utm_medium=modules"
            target="_blank"
            description="Visual tools that help you to know your app."
          >
            <template #title>
              Nuxt DevTools
              <UIcon name="i-ph-medal" class="h-4 w-4 text-primary pointer-events-none" />
            </template>
          </UPageCard>
          <UPageCard
            to="https://ui.nuxt.com/?utm_source=nuxt_website&utm_medium=modules"
            target="_blank"
            description="Fully styled and customizable components."
          >
            <template #title>
              Nuxt UI
              <UIcon name="i-ph-medal" class="h-4 w-4 text-primary pointer-events-none" />
            </template>
          </UPageCard>
        </UPageGrid>
      </div>
    </UPageHero>

    <UPage id="smooth" class="pt-20 -mt-20">
      <template #left>
        <UAside>
          <UNavigationTree :links="[{ label: 'Categories', disabled: true, children: categories }]" />

          <template #bottom>
            <UDivider type="dashed" class="my-6" />

            <UPageLinks :links="links" />
          </template>
        </UAside>
      </template>

      <UPageBody>
        <div class="flex items-center justify-between gap-3 mb-8">
          <UInput
            ref="inputRef"
            :model-value="q"
            name="q"
            icon="i-ph-magnifying-glass"
            placeholder="Search..."
            class="w-56"
            size="md"
            autocomplete="off"
            :ui="{ icon: { trailing: { pointer: '' } } }"
            @update:model-value="replaceRoute('q', $event)"
          >
            <template #trailing>
              <UButton
                v-if="q"
                color="gray"
                variant="link"
                size="xs"
                icon="i-ph-x"
                :padded="false"
                @click="replaceRoute('q', '')"
              />
              <UKbd v-else>
                /
              </UKbd>
            </template>
          </UInput>

          <UButtonGroup>
            <UButton
              :icon="selectedOrder.icon"
              size="md"
              color="gray"
              @click="replaceRoute('orderBy', selectedOrder.key === 'desc' ? 'asc' : 'desc')"
            />
            <USelectMenu
              :model-value="selectedSort"
              :options="sorts"
              size="md"
              color="white"
              class="w-32"
              @update:model-value="replaceRoute('sortBy', $event)"
            />
          </UButtonGroup>
        </div>

        <UPageGrid v-if="filteredModules?.length">
          <UPageCard
            v-for="(module, index) in filteredModules"
            :key="index"
            :to="`/modules/${module.name}`"
            :title="module.name"
            class="flex flex-col overflow-hidden group"
            :ui="{
              body: { base: 'flex-1' },
              footer: { base: 'bg-gray-100/50 dark:bg-gray-800/50' }
            }"
          >
            <template #icon>
              <UAvatar
                :src="moduleImage(module.icon)"
                :icon="moduleIcon(module.category)"
                :alt="module.name"
                size="lg"
                :ui="{ rounded: 'rounded-lg' }"
                class="pointer-events-none"
              />
            </template>

            <template #title>
              <div class="flex items-center space-x-2">
                <span>{{ module.name }}</span>

                <!-- <UTooltip v-if="module.type === 'official'" text="Official module"> -->
                <UBadge
                  v-if="module.type === 'official'"
                  class="space-x-1 shine text-sm items-center justitfy-center pointer-events-none"
                  size="xs"
                  variant="subtle"
                  :ui="{ base: '!flex' }"
                >
                  <UIcon name="i-ph-medal" class="w-4 h-4" />
                  <span>Official</span>
                </UBadge>

                <UBadge
                  v-if="module.sponsor"
                  class="space-x-1 shine text-sm items-center justitfy-center pointer-events-none"
                  size="xs"
                  variant="subtle"
                  color="pink"
                  :ui="{ base: '!flex' }"
                >
                  <UIcon name="i-ph-hand-heart" class="w-4 h-4" />
                  <span>Sponsor</span>
                </UBadge>
              </div>

              <!-- </UTooltip> -->
            </template>

            <template #description>
              <span class="line-clamp-2">{{ module.description }}</span>
            </template>

            <UTooltip
              class="hidden lg:inline-flex absolute top-6 right-6 group-hover:opacity-100 opacity-0 transition"
              :text="`Copy install command`"
            >
              <UButton
                icon="i-ph-package"
                color="white"
                @click="copy(`npx nuxi@latest module add ${module.name}`, { title: 'Command copied to clipboard:', description: `npx nuxi@latest module add ${module.name}` })"
              />
            </UTooltip>

            <template #footer>
              <div class="flex items-center justify-between gap-3 -my-1 text-gray-600 dark:text-gray-300">
                <div class="flex items-center gap-3">
                  <UTooltip text="Monthly NPM Downloads">
                    <NuxtLink
                      class="flex items-center gap-1"
                      :to="`https://npmjs.org/package/${module.npm}`"
                      target="_blank"
                      :class="[selectedSort.key === 'downloads' && 'text-gray-900 dark:text-white']"
                    >
                      <UIcon name="i-ph-arrow-circle-down" class="w-5 h-5 flex-shrink-0" />
                      <span class="text-sm font-medium">{{ formatNumber(module.stats.downloads) }}</span>
                    </NuxtLink>
                  </UTooltip>

                  <UTooltip text="GitHub Stars">
                    <NuxtLink
                      class="flex items-center gap-1"
                      :to="`https://github.com/${module.repo}`"
                      target="_blank"
                      :class="[selectedSort.key === 'stars' && 'text-gray-900 dark:text-white']"
                    >
                      <UIcon name="i-ph-star" class="w-5 h-5 flex-shrink-0" />
                      <span class="text-sm font-medium">{{ formatNumber(module.stats.stars || 0) }}</span>
                    </NuxtLink>
                  </UTooltip>
                </div>

                <UTooltip text="Contributors">
                  <NuxtLink
                    class="flex items-center gap-1"
                    :to="`https://github.com/${module.repo}/graphs/contributors`"
                    target="_blank"
                  >
                    <UIcon name="i-ph-user-circle-gear" class="w-5 h-5 flex-shrink-0" />
                    <span class="text-sm font-medium">{{ module.contributors.length }}</span>
                  </NuxtLink>
                </UTooltip>
              </div>
            </template>
          </UPageCard>
        </UPageGrid>

        <EmptyCard v-else :label="`There is no module found for <b>${q}</b> yet. Become the first one to create it!`">
          <UButton
            label="Contribute on GitHub"
            color="black"
            to="https://github.com/nuxt/modules"
            target="_blank"
            size="md"
            @click="$router.replace({ query: {} })"
          />
          <UButton to="/docs/guide/going-further/modules" color="white" size="md" label="How to create a module?" />
        </EmptyCard>
      </UPageBody>
    </UPage>
  </UContainer>
</template>

<style lang="postcss">
.group:hover .shine {
  text-decoration: none;
  display: inline-block;
  position: relative;
  mask-image: linear-gradient(-75deg, rgba(255,255,255,.8) 30%, #fff 50%, rgba(255,255,255,.8) 70%);
  mask-size: 200%;
  animation: shine 2s linear infinite;
}

@keyframes shine {
  from { -webkit-mask-position: 150%; }
  to { -webkit-mask-position: -50%; }
}
</style>
