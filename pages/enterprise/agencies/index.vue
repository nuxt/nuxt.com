<script setup lang="ts">
const route = useRoute()
const { filteredPartners, fetchList, services, regions } = useEnterprisePartners()

const { data: page } = await useAsyncData(route.path, () => queryContent(route.path).findOne())

useContentHead(page)

await fetchList()
</script>

<template>
  <UContainer>
    <UPageHero v-bind="page">
      <UColorModeImage :light="`${page.image.path}-light.${page.image.format}`" :dark="`${page.image.path}-dark.${page.image.format}`" class="object-contain h-3/4 lg:ml-auto opacity-0 md:opacity-100" :width="page.image.width" :height="page.image.height" />
    </UPageHero>

    <UPage id="smooth" class="pt-20 -mt-20">
      <template #left>
        <UAside>
          <p class="font-semibold text-foreground text-base/9 mb-6">
            Technical Expertise
          </p>

          <UNavigationLinks :links="services" class="mb-6" />

          <p class="font-semibold text-foreground text-base/9 mb-6">
            Locations
          </p>

          <UNavigationLinks :links="regions" />
        </UAside>
      </template>

      <UPageBody>
        <UPageGrid v-if="filteredPartners?.length">
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
