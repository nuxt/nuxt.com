<template>
  <Page v-if="!error" id="smooth" class="pt-16 -mt-16">
    <template #aside>
      <CategoriesAside :categories="categories" :selected-category="selectedCategory" />
    </template>

    <PageList>
      <template #title>
        <span class="hidden lg:block">{{ selectedCategory?.title }}</span>
        <span class="lg:hidden">Category</span>
      </template>

      <template #heading>
        <h2 class="py-1.5 font-semibold u-text-gray-900 text-lg">
          {{ selectedCategory?.title }}
        </h2>
      </template>

      <template #filters>
        <ShowcasesFilterCategory :categories="categories" :selected-category="selectedCategory" class="lg:hidden" @update:selected-category="replaceRoute('category', $event)" />
      </template>

      <div v-if="selectedShowcases.length" class="grid grid-cols-1 gap-8 mt-8 sm:grid-cols-2 xl:grid-cols-3">
        <CardListItem
          v-for="(showcase, key) in selectedShowcases"
          :key="showcase.id"
          body-class="flex flex-col"
          class="rounded-none"
          wrapper-content-class="px-4 py-3"
          :to="showcase.url"
          target="_blank"
          title-class="text-md"
          description-class="text-sm truncate"
          header-class="flex-1 min-h-0"
        >
          <template #header>
            <div class="aspect-w-4 aspect-h-2">
              <div class="flex flex-col">
                <img
                  :src="`https://res.cloudinary.com/nuxt/image/upload/f_auto,q_auto,w_488,h_366/${showcase.screenshotUrl}`"
                  :alt="showcase.hostname"
                  :loading="key === 0 ? 'eager' : 'lazy'"
                  class="object-cover object-top w-full h-full"
                  height="366"
                  width="488"
                >
              </div>
            </div>
          </template>
          <template #title>
            {{ showcase.title || showcase.hostname }}
          </template>
          <template #description>
            {{ showcase.hostname }}
          </template>
        </CardListItem>
      </div>
    </PageList>
  </Page>
  <Page v-else>
    <p class="text-center">
      Sorry an error occured while fetching showcases...
    </p>
  </Page>
</template>

<script setup lang="ts">
const { fetchList, selectedShowcases, categories, selectedCategory } = useResourcesShowcases()

const error = await fetchList()

const { createReplaceRoute } = useFilters()

let replaceRoute: (key: string, value: string) => void

onMounted(() => {
  replaceRoute = createReplaceRoute('showcase')
})
</script>
