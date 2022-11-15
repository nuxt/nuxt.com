<template>
  <Page id="smooth" class="pt-16 -mt-16">
    <template #aside>
      <ModulesAside />
    </template>

    <PageList :title="`${filteredModules.length} module${filteredModules.length > 1 ? 's' : ''} found`">
      <template #heading>
        <ModulesFilterSearch class="hidden md:block" />
      </template>
      <template #filters>
        <ModulesFilterVersion size="sm" class="lg:hidden" />
        <ModulesFilterSearch size="sm" class="md:hidden" />
        <ModulesFilterType class="lg:hidden" />
        <ModulesFilterCategory class="lg:hidden" />
        <ModulesFilters class="hidden lg:flex" />
        <ModulesFilterSort />
      </template>

      <div class="hidden _ellipse lg:block" />

      <ul v-if="filteredModules.length" class="grid grid-cols-1 gap-8 mt-8 sm:grid-cols-2 xl:grid-cols-3">
        <li v-for="(filteredModule, index) in filteredModules" :key="index">
          <ModulesListItem :module="filteredModule" />
        </li>
      </ul>
      <div v-else class="relative flex flex-col items-center gap-6 mt-16 lg:mt-24">
        <Icon name="fa-brands:github" class="w-16 h-16 u-text-gray-600" />
        <span class="text-xl font-medium text-center u-text-gray-700">
          There is no module found for <b>{{ q }}</b> yet.<br>Become the first one to create it!
        </span>

        <div class="flex items-center gap-3">
          <UButton
            to="https://github.com/nuxt/modules"
            target="_blank"
            variant="primary"
            size="lg"
            label="Contribute on GitHub"
            truncate
          />
          <UButton
            to="/docs/guide/going-further/modules"
            variant="secondary"
            size="lg"
            label="How to create a module"
            icon="uil:arrow-right"
            trailing
            truncate
          />
        </div>
      </div>
    </PageList>
  </Page>
</template>

<script setup lang="ts">
const { modules, selectedCategory, selectedType, selectedVersion, selectedSort, selectedOrder, q } = useModules()

const filteredModules = computed(() => {
  let filteredModules = [...modules.value]
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
      const queryRegExp = searchTextRegExp(q.value as string)
      if (q.value && !['name', 'npm', 'category', 'description', 'repo'].map(field => module[field]).filter(Boolean).some(value => value.search(queryRegExp) !== -1)) {
        return false
      }

      return true
    })
    .sort((a, b) => b[selectedSort.value.key] - a[selectedSort.value.key])

  if (selectedOrder.value.key === 'asc') {
    filteredModules = filteredModules.reverse()
  }

  return filteredModules
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
