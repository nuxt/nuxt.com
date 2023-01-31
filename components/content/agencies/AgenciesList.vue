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
          <CardListItem :to="filteredPartner._path">
            <template #header>
              <div>
                <img v-if="filteredPartner.logo?.light" :src="filteredPartner.logo.light" :alt="filteredPartner?.title" class="w-auto h-12 dark:hidden">
                <img v-if="filteredPartner.logo?.dark" :src="filteredPartner.logo.dark" :alt="filteredPartner?.title" class="hidden w-auto h-12 dark:block">
              </div>
              <span class="text-sm u-text-gray-400">{{ filteredPartner.location?.title }}</span>
            </template>
            <template #title>
              {{ filteredPartner?.title }}
            </template>
            <template #description>
              {{ filteredPartner.description }}
            </template>
          </CardListItem>
        </li>
      </ul>
      <NotFound
        v-else
        icon="ph:handshake-thin"
        :reset-filter="true"
        :buttons="[
          { variant: 'primary', size: 'lg', label: 'Reset filters', icon: 'grommet-icons:power-reset', trailing: true },
          {
            to: 'https://docs.google.com/forms/d/e/1FAIpQLSf85qskit5QqmGJcruGkGF0U7240Bh9MeN0pHB18UiOMWC8dA/viewform',
            target: '_blank', variant: 'primary-gradient', size: 'lg', label: 'Submit my agency' }]"
      >
        <span>No agency matches your criteria for now.</span>
      </NotFound>
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
