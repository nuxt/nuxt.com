<script setup lang="ts">
definePageMeta({
  heroBackground: 'opacity-70 -z-10'
})

const { fetchList, providers } = useHostingProviders()

const { data: page } = await useAsyncData('deploy-landing', () => queryCollection('landing').path('/deploy').first())
if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

const title = page.value.title
const description = page.value.description

useSeoMeta({
  titleTemplate: '%s',
  title,
  description,
  ogDescription: description,
  ogTitle: title
})

defineOgImageComponent('Docs', {
  title: 'Deploy Nuxt'
})

await fetchList()

const featuredProviders = computed(() => providers.value.filter(provider => provider.featured === true))
const otherProviders = computed(() => providers.value.filter(provider => provider.featured !== true))
</script>

<template>
  <UContainer>
    <UPageHero
      v-bind="page"
      :ui="{
        container: 'py-10 sm:py-20 lg:py-20 px-0 sm:px-0 lg:px-0',
        title: 'sm:text-5xl'
      }"
    />

    <UPage>
      <UPageBody>
        <h2 class="text-2xl font-semibold mb-4">
          Featured
        </h2>

        <UPageGrid>
          <UPageCard
            v-for="(deployment, index) in featuredProviders"
            :key="index"
            :to="deployment.path"
            :title="deployment.title"
            :description="deployment.description"
            variant="subtle"
            class="flex flex-col overflow-hidden"
            :ui="{
              container: 'p-0 sm:p-0',
              body: 'p-4 sm:p-6',
              header: 'relative mb-0',
              title: 'text-xl',
              description: 'line-clamp-2 text-(--ui-text-muted)'
            }"
          >
            <template #header>
              <div class="h-[192px] w-full gradient dark:gradient-dark" />
              <div class="absolute inset-0 size-full flex items-center justify-center">
                <component :is="deployment.componentImg" />
              </div>
            </template>
          </UPageCard>
        </UPageGrid>

        <h2 class="text-2xl font-semibold pt-12 mb-4">
          Others
        </h2>

        <UPageGrid>
          <UPageCard
            v-for="(deployment, index) in otherProviders"
            :key="index"
            :to="deployment.path"
            :title="deployment.title"
            :description="deployment.description"
            variant="subtle"
            class="flex flex-col overflow-hidden"
            :ui="{
              description: 'line-clamp-2'
            }"
          >
            <template #leading>
              <img v-if="deployment.logoSrc" :src="deployment.logoSrc" width="10" height="10" class="w-10 h-10">
              <UIcon v-else :name="deployment.logoIcon" class="size-10 text-black dark:text-white" />
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

<style>
.gradient {
  background-image: linear-gradient(105deg, #f8fafc 5.03%, #f1f5f9 102.15%);
}
.dark .gradient {
  background-image: linear-gradient(105deg, #020420 5.03%, #010211 102.15%);
}
</style>
