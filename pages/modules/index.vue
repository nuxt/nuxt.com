<script setup lang="ts">
const route = useRoute()

const { data: page } = await useAsyncData(route.path, () => queryContent(route.path).findOne())

useContentHead(page)

const { fetchList, filteredModules, categories } = useModules()

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
            <UInput name="q" icon="i-uil-search-alt" placeholder="Search..." class="w-full" autocomplete="off" />
          </template>

          <UNavigationLinks :links="categories" />

          <template #bottom>
            <hr class="border-gray-200 dark:border-gray-800 border-dashed my-6">

            <div class="flex flex-col gap-y-4">
              <UButton
                to="https://github.com/nuxt/modules"
                color="gray"
                variant="link"
                label="Contribute on GitHub"
                icon="i-simple-icons-github"
                :padded="false"
              />
              <UButton
                to="/docs/guide/going-further/modules"
                color="gray"
                variant="link"
                label="Module Author guide"
                icon="i-uil-book-open"
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
          >
            <template #description>
              <span class="line-clamp-2">{{ module.description }}</span>
            </template>
          </UPageCard>
        </UPageGrid>
      </UPageBody>
    </UPage>
  </UContainer>
</template>
