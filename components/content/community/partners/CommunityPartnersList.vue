<template>
  <DocsPage id="smooth" :sticky="false" class="pt-16 -mt-16">
    <template #aside>
      <CommunityPartnersAside />
    </template>

    <div class="flex items-center justify-between">
      <h2 class="flex items-end gap-3 text-3xl font-semibold u-text-gray-900">
        {{ filteredPartners.length }} partner{{ filteredPartners.length > 1 ? 's' : '' }} found
      </h2>
    </div>

    <div class="hidden _ellipse lg:block" />

    <ul v-if="filteredPartners.length" class="grid grid-cols-1 gap-8 mt-8 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
      <li v-for="(filteredPartner, index) in filteredPartners" :key="index">
        <CommunityPartnersListItem :partner="filteredPartner" />
      </li>
    </ul>
  </DocsPage>
</template>

<script setup lang="ts">
const { partners, selectedCategory, selectedService } = useCommunityPartners()

const filteredPartners = computed(() => {
  return [...partners.value]
    .filter((partner) => {
      if (selectedCategory.value && partner.category !== selectedCategory.value.key) {
        return false
      }
      if (selectedService.value && !partner.services.find(service => service.key === selectedService.value.key)) {
        return false
      }

      return true
    })
})
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
