<template>
  <Page v-if="!error" id="smooth" class="pt-16 -mt-16">
    <template #aside>
      <AgenciesAside />
    </template>

    <PageList :title="`${filteredPartners.length} partner${filteredPartners.length > 1 ? 's' : ''} found`">
      <template #filters>
        <AgenciesFilters class="hidden lg:flex" />
        <AgenciesFilterServices :services="services" :selected-service="selectedService" class="lg:hidden" @update:selected-service="replaceRoute('service', $event)" />
        <AgenciesFilterRegions :regions="regions" :selected-region="selectedRegion" class="lg:hidden" @update:selected-region="replaceRoute('region', $event)" />
      </template>

      <div class="hidden _ellipse lg:block" />

      <ul v-if="filteredPartners.length" class="grid grid-cols-1 gap-8 mt-8 sm:grid-cols-2 xl:grid-cols-3">
        <li v-for="filteredPartner in filteredPartners" :key="filteredPartner._id">
          <AgenciesListItem :partner="filteredPartner" />
        </li>
      </ul>
    </PageList>
  </Page>
  <Page v-else>
    <p class="text-center">
      Sorry an error occured while fetching Nuxt partners...
    </p>
  </Page>
</template>

<script setup lang="ts">
const { filteredPartners, fetchList, services, selectedService, regions, selectedRegion } = useAgencyPartners()

const { createReplaceRoute } = useFilters()

const replaceRoute = createReplaceRoute('support-agencies')

const error = await fetchList()
</script>

<style scoped>
._ellipse {
  position: absolute;
  width: 600px;
  height: 160px;
  left: 0;
  top: 0;

  background: linear-gradient(97.62deg, rgba(0, 71, 225, 0.22) 2.27%, rgba(26, 214, 255, 0.22) 50.88%, rgba(0, 220, 130, 0.22) 98.48%);
  filter: blur(169px);
  transform: matrix(-0.95, -0.3, -0.3, 0.95, 200, 250);
}
</style>
