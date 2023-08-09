<script setup lang="ts">
const route = useRoute()
const { filteredAgencies, fetchList, services, regions } = useEnterpriseAgencies()

const { data: page } = await useAsyncData(route.path, () => queryContent(route.path).findOne())

useContentHead(page)

await fetchList()

const links = computed(() => [{
  label: 'Technical Expertise',
  children: services.value
}, {
  label: 'Locations',
  children: regions.value
}])
</script>

<template>
  <UContainer>
    <UPageHero v-bind="page">
      <UColorModeImage :light="`${page.image.path}-light.${page.image.format}`" :dark="`${page.image.path}-dark.${page.image.format}`" class="object-contain h-3/4 lg:ml-auto opacity-0 md:opacity-100" :width="page.image.width" :height="page.image.height" />
    </UPageHero>

    <UPage id="smooth" class="pt-20 -mt-20">
      <template #left>
        <UAside>
          <UNavigationTree :links="links" />
        </UAside>
      </template>

      <UPageBody>
        <UPageGrid v-if="filteredAgencies?.length">
          <UPageCard
            v-for="(agency, index) in filteredAgencies"
            :key="index"
            :to="agency.link"
            :title="agency.title"
            :description="agency.description"
            :ui="{
              divide: '',
              header: { base: 'aspect-w-4 aspect-h-2', padding: '' },
              footer: { base: 'text-subdued', padding: 'px-4 pb-4 sm:px-6' },
              title: 'text-lg',
              description: 'line-clamp-3'
            }"
          >
            <template #icon>
              <UColorModeAvatar :light="agency.logo.light" :dark="agency.logo.dark" size="lg" />
            </template>

            <template #footer>
              {{ agency.location.title }}
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
