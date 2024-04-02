<script setup lang="ts">
import type { Hosting } from '../../types'

const route = useRoute()
const { fetchList, providers } = useHostingProviders()

const { data: page } = await useAsyncData(route.path, () => queryContent(route.path).findOne())

const title = page.value.head?.title || page.value.title
const description = page.value.head?.description || page.value.description

useSeoMeta({
  titleTemplate: '%s',
  title,
  description,
  ogDescription: description,
  ogTitle: title
})

await fetchList()

const featuredProviders = computed(() => providers.value.filter((provider: Hosting) => provider.featured === true))
const otherProviders = computed(() => providers.value.filter((provider: Hosting) => provider.featured !== true))
</script>

<template>
  <UContainer>
    <UPageHero v-bind="page" />

    <UPage>
      <UPageBody>
        <h2 class="text-gray-950 dark:text-white text-2xl font-semibold pb-4">
          Featured
        </h2>

        <UPageGrid>
          <UPageCard
            v-for="(deployment, index) in featuredProviders"
            :key="index"
            :to="deployment._path"
            :title="deployment.title"
            :description="deployment.description"
            class="flex flex-col overflow-hidden"
            :ui="{
              divide: '',
              to: ' hover:ring-2 hover:ring-primary-500 dark:hover:ring-primary-400 hover:!bg-transparent dark:hover:!bg-gray-900',
              header: { base: 'relative flex items-center justify-center', padding: '' },
              footer: { padding: 'pt-0' },
              title: 'text-lg',
              icon: { wrapper: 'mb-4' },
              description: 'line-clamp-2'
            }"
          >
            <template #header>
              <div class="h-[192px] w-full gradient dark:gradient-dark" />
              <div class="absolute inset-0 w-full h-full flex items-center justify-center">
                <component :is="deployment.componentImg" />
              </div>
            </template>
          </UPageCard>
        </UPageGrid>

        <h2 class="text-gray-950 dark:text-white text-2xl font-semibold pt-12 pb-4">
          Others
        </h2>

        <UPageGrid>
          <UPageCard
            v-for="(deployment, index) in otherProviders"
            :key="index"
            :to="deployment._path"
            :title="deployment.title"
            :description="deployment.description"
            class="flex flex-col overflow-hidden"
            :ui="{
              divide: '',
              header: { base: 'aspect-w-4 aspect-h-2', padding: '' },
              footer: { padding: 'pt-0' },
              title: 'text-lg',
              description: 'line-clamp-2'
            }"
          >
            <template #icon>
              <img v-if="deployment.logoSrc" :src="deployment.logoSrc" width="10" height="10" class="w-10 h-10">
              <UIcon v-else :name="deployment.logoIcon" class="w-10 h-10 text-black dark:text-white" />
            </template>
            <template #title>
              {{ deployment.title }}
            </template>
            <template #description>
              <span class="line-clamp-2">{{ deployment.description }}</span>
            </template>
          </UPageCard>
        </UPageGrid>
      </UPageBody>
    </UPage>
  </UContainer>
</template>

<style lang="postcss">
.gradient {
  background-image: linear-gradient(105deg, #f8fafc 5.03%, #f1f5f9 102.15%);
}
.dark .gradient {
  background-image: linear-gradient(105deg, #020420 5.03%, #010211 102.15%);
}
</style>
