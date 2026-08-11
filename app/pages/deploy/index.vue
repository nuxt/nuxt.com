<script setup lang="ts">
import { clientContent } from '~/composables/client-content'

definePageMeta({
  heroBackground: 'opacity-30 -z-10'
})

const { fetchList, providers } = useHostingProviders()

const { data: page } = await useAsyncData('deploy-landing', () => clientContent.get('/deploy'))
if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

const title = page.value.data.head?.title || page.value.data.title
const description = page.value.data.head?.description || page.value.data.description

useSeoMeta({
  titleTemplate: '%s',
  title,
  description,
  ogDescription: description,
  ogTitle: title
})
useCanonical()

defineOgImage('Docs.takumi', {
  title,
  description
})

await fetchList()
</script>

<template>
  <UContainer v-if="page">
    <UPage>
      <template #left>
        <UPageAside>
          <UNavigationMenu
            variant="pill"
            highlight
            orientation="vertical"
            :items="providers.map(provider => ({
              label: provider.data.title,
              to: provider.path,
              badge: provider.data.sponsor ? 'Sponsor' : undefined
            })).sort((a, b) => a.label.localeCompare(b.label))"
          />
        </UPageAside>
      </template>
      <UPageBody>
        <UPageGrid>
          <UPageCard
            v-for="(deployment, index) in providers"
            :key="index"
            :to="deployment.path"
            :title="deployment.data.title"
            :description="deployment.data.description"
            variant="subtle"
            class="flex flex-col overflow-hidden"
            :ui="{
              description: 'line-clamp-2'
            }"
          >
            <template #leading>
              <NuxtImg v-if="deployment.data.logoSrc" :src="deployment.data.logoSrc" width="40" height="40" class="w-10 h-10" />
              <UIcon v-else :name="deployment.data.logoIcon" class="size-10 text-black dark:text-white" />
            </template>
            <UBadge
              v-if="deployment.data.sponsor"
              class="shine absolute top-4 right-4 sm:top-6 sm:right-6"
              variant="subtle"
              color="important"
              label="Sponsor"
            />
            <template #title>
              {{ deployment.data.title }}
            </template>
            <template #description>
              <span class="line-clamp-2">{{ deployment.data.description }}</span>
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
