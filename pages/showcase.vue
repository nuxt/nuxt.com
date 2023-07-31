<script setup lang="ts">
const route = useRoute()
const { fetchList, selectedShowcases, categories } = useShowcases()
const { createReplaceRoute } = useFilters()

const { data: page } = await useAsyncData(route.path, () => queryContent(route.path).findOne())

useContentHead(page)

const replaceRoute = createReplaceRoute('showcase')

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
          <UNavigationLinks :links="categories" />
        </UAside>
      </template>

      <UPageBody>
        <UPageGrid>
          <UPageCard
            v-for="(showcase, index) in selectedShowcases"
            :key="showcase.slug"
            :to="showcase.url"
            :title="showcase.title || showcase.hostname"
            :description="showcase.hostname"
            :ui="{ header: { base: 'aspect-w-4 aspect-h-2', padding: '' }, body: { padding: 'p-4' } }"
          >
            <template #header>
              <img
                :src="`https://res.cloudinary.com/nuxt/image/upload/f_auto,q_auto,w_488,h_366/${showcase.screenshotUrl}`"
                :alt="showcase.hostname || ''"
                :loading="index === 0 ? 'eager' : 'lazy'"
                class="object-cover object-top w-full h-full"
                height="366"
                width="488"
              >
            </template>
          </UPageCard>
        </UPageGrid>
      </UPageBody>
    </UPage>
  </UContainer>
</template>
