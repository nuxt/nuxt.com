<script setup lang="ts">
import type { ButtonProps } from '@nuxt/ui'
import type { ContentNavigationItem } from '~/utils/content'
import { clientContent } from '~/composables/client-content'

definePageMeta({
  heroBackground: 'opacity-80 -z-10'
})

const { filteredAgencies, fetchList, services, regions } = useEnterpriseAgencies()

const { data: page } = await useAsyncData('agencies-landing', () => clientContent.get('/enterprise/agencies'))
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
  headline: 'Enterprise',
  title,
  description
})

const navigation = computed<ContentNavigationItem[]>(() => {
  return [
    {
      title: 'Technical Expertise',
      path: '/enterprise/agencies',
      children: services.value.map(service => ({ ...service, title: service.title ?? '', path: '/enterprise/agencies' }))
    },
    {
      title: 'Locations',
      path: '/enterprise/agencies',
      children: regions.value.map(region => ({ ...region, title: region.title ?? '', path: '/enterprise/agencies' }))
    }
  ]
})

await fetchList()
</script>

<template>
  <UContainer v-if="page">
    <UPageHero
      :title="page.data.title"
      :description="page.data.description"
      :links="(page.data.links as ButtonProps[])"
    />

    <UPage id="smooth" class="pt-20 -mt-20">
      <template #left>
        <UPageAside>
          <UContentNavigation highlight :navigation="navigation" :collapsible="false" />
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
            to="https://opencollective.com/nuxtjs/contribute/agency-partner-93555"
            target="_blank"
            color="neutral"
            size="md"
            label="Become a partner"
          />
        </EmptyCard>
      </UPageBody>
    </UPage>
  </UContainer>
</template>
