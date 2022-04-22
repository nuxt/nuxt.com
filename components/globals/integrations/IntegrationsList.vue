<template>
  <DocsPage id="smooth" :offset="false">
    <template #aside>
      <IntegrationsAside :selected-category="selectedCategory" :selected-version="selectedVersion" />
    </template>

    <h2 class="font-semibold u-text-gray-900 text-3xl">
      {{ selectedCategory?.label || 'All integrations' }}
    </h2>

    <ul v-if="filteredModules.length" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 mt-8">
      <li v-for="(filteredModule, index) in filteredModules" :key="index">
        <IntegrationsListItem :module="filteredModule" />
      </li>
    </ul>
  </DocsPage>
</template>

<script setup lang="ts">
const route = useRoute()
const { modules, categories, versions } = useModules()

const selectedCategory = computed(() => {
  return categories.value.find(category => category.key === route.query.category)
})

const selectedVersion = computed(() => {
  return versions.value.find(version => version.key === route.query.version) || versions.value[0]
})

const filteredModules = computed(() => {
  return [...modules.value].filter((module) => {
    if (selectedCategory.value && module.category !== selectedCategory.value.key) {
      return false
    }
    if (selectedVersion.value && !module.tags.includes(selectedVersion.value.key)) {
      return false
    }
    if (route.query.q && !['name', 'npm', 'category', 'description', 'repo'].map(field => module[field]).filter(Boolean).some(value => value.search(new RegExp(route.query.q, 'i')) !== -1)) {
      return false
    }

    return true
  })
})
</script>
