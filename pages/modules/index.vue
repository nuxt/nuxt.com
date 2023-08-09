<script setup lang="ts">
const inputRef = ref()

const route = useRoute()
const { replaceRoute } = useFilters('modules')
const { fetchList, filteredModules, q, categories, selectedOrder, sorts, selectedSort } = useModules()

const { data: page } = await useAsyncData(route.path, () => queryContent(route.path).findOne())

useContentHead(page)

await fetchList()

defineShortcuts({
  '/': () => {
    inputRef.value.input.focus()
  }
})
</script>

<template>
  <UContainer>
    <UPageHero v-bind="page">
      <UColorModeImage :light="`${page.image.path}-light.${page.image.format}`" :dark="`${page.image.path}-dark.${page.image.format}`" class="object-contain h-3/4 lg:ml-auto opacity-0 md:opacity-100" :width="page.image.width" :height="page.image.height" />
    </UPageHero>

    <UPage id="smooth" class="pt-20 -mt-20">
      <template #left>
        <UAside>
          <UNavigationTree :links="[{ label: 'Categories', children: categories }]" />

          <template #bottom>
            <hr class="border-border border-dashed my-6">

            <div class="flex flex-col gap-y-4">
              <UButton
                to="/docs/guide/going-further/modules"
                color="gray"
                variant="link"
                label="Module Author Guide"
                icon="i-ph-book-open"
                :padded="false"
              />
              <UButton
                to="https://github.com/nuxt/modules#addupdate-a-module"
                color="gray"
                variant="link"
                label="Add a Module"
                icon="i-ph-plus-circle"
                :padded="false"
              />
            </div>
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
            <UButton :icon="selectedOrder.icon" size="md" color="gray" @click="replaceRoute('orderBy', selectedOrder.key === 'desc' ? 'asc' : 'desc')" />
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
            class="flex flex-col"
            :ui="{ body: { base: 'flex-1' } }"
          >
            <template #icon>
              <UAvatar :src="module.icon.match(/^http(s)?:\/\//) ? module.icon : `https://api.nuxtjs.org/api/ipx/s_80,f_webp/gh/nuxt/modules/main/icons/${module.icon}`" :alt="module.name" size="lg" :ui="{ rounded: 'rounded-lg' }" />
            </template>

            <template #title>
              {{ module.name }}

              <UTooltip v-if="module.type === 'official'" text="Official module">
                <div class="flex items-center justify-center rounded-full bg-primary h-6 w-6">
                  <UIcon name="i-ph-medal" class="h-4 w-4 text-white" />
                </div>
              </UTooltip>
            </template>

            <template #description>
              <span class="line-clamp-2">{{ module.description }}</span>
            </template>

            <template #footer>
              <div class="flex items-center justify-between gap-3 -my-1">
                <div class="flex items-center gap-3">
                  <UTooltip text="Monthly NPM Downloads">
                    <div class="flex items-center gap-1">
                      <UIcon name="i-ph-arrow-circle-down-duotone" class="w-5 h-5 flex-shrink-0" :class="[selectedSort.key === 'downloads' && 'text-primary']" />
                      <span class="text-sm font-medium">{{ formatNumber(module.stats.downloads) }}</span>
                    </div>
                  </UTooltip>
                  <UTooltip text="GitHub Stars">
                    <div class="flex items-center gap-1">
                      <UIcon name="i-ph-star-duotone" class="w-5 h-5 flex-shrink-0" :class="[selectedSort.key === 'stars' && 'text-primary']" />
                      <span class="text-sm font-medium">{{ formatNumber(module.stats.stars) }}</span>
                    </div>
                  </UTooltip>
                </div>

                <UTooltip text="Contributors">
                  <div class="flex items-center gap-1">
                    <UIcon name="i-ph-user-circle-gear-duotone" class="w-5 h-5 flex-shrink-0" />
                    <span class="text-sm font-medium">{{ module.contributors.length }}</span>
                  </div>
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
          <UButton
            to="/docs/guide/going-further/modules"
            color="white"
            size="md"
            label="How to create a module?"
          />
        </EmptyCard>
      </UPageBody>
    </UPage>
  </UContainer>
</template>
