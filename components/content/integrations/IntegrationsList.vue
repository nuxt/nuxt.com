<template>
  <DocsPage id="smooth" class="pt-16 -mt-16">
    <template #aside>
      <IntegrationsAside />
    </template>

    <div class="flex items-center justify-between">
      <h2 class="flex items-end gap-3 text-3xl font-semibold u-text-gray-900">
        {{ filteredModules.length }} module{{ filteredModules.length > 1 ? 's' : '' }} found
      </h2>

      <IntegrationsFilterSort />
    </div>

    <div class="hidden _ellipse lg:block" />

    <ul v-if="filteredModules.length" class="grid grid-cols-1 gap-8 mt-8 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
      <li v-for="(filteredModule, index) in filteredModules" :key="index">
        <IntegrationsListItem :module="filteredModule" />
      </li>
    </ul>
  </DocsPage>
</template>

<script setup lang="ts">
const { modules, selectedCategory, selectedType, selectedVersion, selectedSort, q } = useIntegrations()

const filteredModules = computed(() => {
  return [...modules.value]
    .filter((module) => {
      if (selectedCategory.value && module.category !== selectedCategory.value.key) {
        return false
      }
      if (selectedType.value && module.type !== selectedType.value.key) {
        return false
      }
      if (selectedVersion.value && !module.tags.includes(selectedVersion.value.key)) {
        return false
      }
      if (q.value && !['name', 'npm', 'category', 'description', 'repo'].map(field => module[field]).filter(Boolean).some(value => value.search(new RegExp(q.value, 'i')) !== -1)) {
        return false
      }

      return true
    })
    .sort((a, b) => b[selectedSort.value.key] - a[selectedSort.value.key])
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
