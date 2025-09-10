<script setup lang="ts">
import type { ContentNavigationLink } from '@nuxt/ui/runtime/types/content.js'

definePageMeta({
  heroBackground: 'opacity-80 -z-10'
})

const { filteredAgencies, fetchList, services, regions } = useEnterpriseAgencies()

const { data: page } = await useAsyncData('agencies-landing', () => queryCollection('landing').path('/enterprise/agencies').first())
if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

const title = page.value.title
const description = page.value.description
useSeoMeta({
  titleTemplate: '%s · Enterprise',
  title,
  description,
  ogDescription: description,
  ogTitle: `${title} · Enterprise`
})

defineOgImageComponent('Docs', {
  headline: 'Enterprise',
  title,
  description
})

const navigation = computed(() => {
  return [
    { title: 'Technical Expertise', children: services.value, path: '/enterprise/agencies' },
    { title: 'Locations', children: regions.value, path: '/enterprise/agencies' }
  ] as unknown as ContentNavigationLink[]
})

await fetchList()
</script>

<template>
  <UContainer v-if="page">
    <UPageHero
      :title="title"
      :description="description"
      :links="page.links"
    />

    <UPage id="smooth" class="pt-20 -mt-20">
      <template #left>
        <UPageAside>
          <UContentNavigation highlight :navigation="navigation" />
        </UPageAside>
      </template>

      <UPageBody>
        <UPageGrid v-if="filteredAgencies?.length" class="lg:grid-cols-2">
          <UPageCard
            v-for="(agency, index) in filteredAgencies"
            :key="index"
            variant="subtle"
            :to="agency.path"
            :title="agency.title"
            :description="agency.description"
          >
            <template #leading>
              <UColorModeAvatar
                :light="agency.logo.light"
                :dark="agency.logo.dark"
                :alt="agency.location.title"
                size="lg"
                class="rounded-none bg-transparent"
              />
            </template>

            <template #footer>
              <UBadge :label="agency.location.title" color="neutral" variant="subtle" />
            </template>
          </UPageCard>
        </UPageGrid>

        <EmptyCard v-else label="No agency matches your criteria for now.">
          <UButton
            label="Clear filters"
            color="neutral"
            variant="subtle"
            trailing-icon="i-lucide-circle-x"
            size="md"
            @click="$router.replace({ query: {} })"
          />
          <UButton
            to="https://docs.google.com/forms/d/e/1FAIpQLSf85qskit5QqmGJcruGkGF0U7240Bh9MeN0pHB18UiOMWC8dA/viewform"
            target="_blank"
            color="neutral"
            size="md"
            label="Submit my agency"
          />
        </EmptyCard>
      </UPageBody>
    </UPage>
  </UContainer>
</template>
