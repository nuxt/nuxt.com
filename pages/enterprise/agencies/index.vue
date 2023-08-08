<script setup lang="ts">
const route = useRoute()
const { filteredPartners, fetchList, services, selectedService, regions, selectedRegion } = useEnterprisePartners()
const { createReplaceRoute } = useFilters()

const { data: page } = await useAsyncData(route.path, () => queryContent(route.path).findOne())

useContentHead(page)

const replaceRoute = createReplaceRoute('enterprise-agencies')

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
        <UPageGrid>
          <UPageCard
            v-for="(partner, index) in filteredPartners"
            :key="index"
            :to="partner.link"
            :title="partner.title"
            :description="partner.description"
            :ui="{
              divide: '',
              header: { base: 'aspect-w-4 aspect-h-2', padding: '' },
              footer: { base: 'text-subdued', padding: 'px-4 pb-4 sm:px-6' },
              title: 'text-lg',
              description: 'line-clamp-3'
            }"
          >
            <template #icon>
              <UColorModeAvatar :light="partner.logo.light" :dark="partner.logo.dark" size="lg" />
            </template>

            <template #footer>
              {{ partner.location.title }}
            </template>
          </UPageCard>
        </UPageGrid>
      </UPageBody>
    </UPage>
  </UContainer>
</template>
