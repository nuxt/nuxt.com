<script setup lang="ts">
const route = useRoute()
const { createReplaceRoute } = useFilters()
const { fetchList, filteredModules, categories, q } = useModules()

const { data: page } = await useAsyncData(route.path, () => queryContent(route.path).findOne())

useContentHead(page)

const replaceRoute = createReplaceRoute('modules')

await fetchList()
</script>

<template>
  <UContainer>
    <UPageHero v-bind="page">
      <UColorModeImage :light="`${page.image.path}-light.${page.image.format}`" :dark="`${page.image.path}-dark.${page.image.format}`" class="object-contain h-3/4 lg:ml-auto opacity-0 md:opacity-100" :width="page.image.width" :height="page.image.height" />
    </UPageHero>

    <UPage id="smooth" class="pt-20 -mt-20">
      <template #left>
        <UAside>
          <template #top>
            <UInput
              :model-value="q"
              name="q"
              icon="i-ph-magnifying-glass"
              placeholder="Search..."
              class="w-full"
              autocomplete="off"
              @update:model-value="replaceRoute('q', $event)"
            />
          </template>

          <UNavigationLinks :links="categories" />

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
        <UPageGrid>
          <UPageCard
            v-for="module in filteredModules"
            :key="module.name"
            :to="`/modules/${module.name}`"
            :title="module.name"
            class="flex flex-col"
            :ui="{ body: { base: 'flex-1' } }"
          >
            <template #icon>
              <UAvatar :src="module.icon.match(/^http(s)?:\/\//) ? module.icon : `https://api.nuxtjs.org/api/ipx/s_80,f_webp/gh/nuxt/modules/main/icons/${module.icon}`" :alt="module.name" size="lg" icon="i-ph-image" :ui="{ rounded: 'rounded-lg' }" />
            </template>

            <template #title>
              {{ module.name }}

              <div v-if="module.type === 'official'" class="flex items-center justify-center rounded-full bg-primary h-6 w-6">
                <UIcon name="i-ph-medal" class="h-4 w-4 text-white" />
              </div>
            </template>

            <template #description>
              <span class="line-clamp-2">{{ module.description }}</span>
            </template>

            <template #footer>
              <div class="flex items-center justify-between gap-3 -my-1">
                <div class="flex items-center gap-3">
                  <div class="flex items-center gap-1.5">
                    <UIcon name="i-ph-star" class="w-4 h-4" />

                    <span class="text-sm">{{ formatNumber(module.stats.stars) }}</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <UIcon name="i-ph-download-simple" class="w-4 h-4" />

                    <span class="text-sm">{{ formatNumber(module.stats.downloads) }}</span>
                  </div>
                </div>

                <div class="flex items-center gap-1.5">
                  <UIcon name="i-ph-users-three" class="w-4 h-4" />

                  <span class="text-sm">{{ module.contributors.length }}</span>
                </div>
              </div>
            </template>
          </UPageCard>
        </UPageGrid>
      </UPageBody>
    </UPage>
  </UContainer>
</template>
