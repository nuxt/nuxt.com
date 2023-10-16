<script setup lang="ts">
const route = useRoute()
const { filteredAgencies, fetchList, services, regions } = useEnterpriseAgencies()

const { data: page } = await useAsyncData(route.path, () => queryContent(route.path).findOne())

useSeoMeta({
  titleTemplate: 'Explore Nuxt Agencies',
  title: page.value.head?.title || page.value.title,
  description: page.value.head?.description || page.value.description
})

await fetchList()
</script>

<template>
  <UContainer>
    <UPageHero v-bind="page" />

    <UPage id="smooth" class="pt-20 -mt-20">
      <template #left>
        <UAside>
          <UNavigationTree :links="[{ label: 'Technical Expertise', disabled: true, children: services }, { label: 'Locations', disabled: true, children: regions }]" />
        </UAside>
      </template>

      <UPageBody>
        <UPageGrid v-if="filteredAgencies?.length">
          <UPageCard
            v-for="(agency, index) in filteredAgencies"
            :key="index"
            :to="agency._path"
            :title="agency.title"
            :description="agency.description"
            :ui="{
              divide: '',
              footer: { padding: 'pt-0' },
              title: 'text-lg',
              description: 'line-clamp-3'
            }"
          >
            <template #icon>
              <UColorModeAvatar :light="agency.logo.light" :dark="agency.logo.dark" size="lg" :ui="{ rounded: 'rounded-sm' }" />
            </template>

            <template #footer>
              <UBadge :label="agency.location.label" color="gray" />
            </template>
          </UPageCard>
        </UPageGrid>

        <EmptyCard v-else label="No agency matches your criteria for now.">
          <UButton
            label="Clear filters"
            color="white"
            trailing-icon="i-ph-x-circle"
            size="md"
            @click="$router.replace({ query: {} })"
          />
          <UButton
            to="https://docs.google.com/forms/d/e/1FAIpQLSf85qskit5QqmGJcruGkGF0U7240Bh9MeN0pHB18UiOMWC8dA/viewform"
            target="_blank"
            color="black"
            size="md"
            label="Submit my agency"
          />
        </EmptyCard>
      </UPageBody>
    </UPage>
  </UContainer>
</template>
