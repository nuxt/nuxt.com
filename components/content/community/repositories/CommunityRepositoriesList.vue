<template>
  <DocsPage id="smooth" class="pt-16 -mt-16">
    <template #aside>
      <CommunityRepositoriesAside />
    </template>

    <div class="flex items-center justify-between">
      <h2 class="flex items-end gap-3 text-3xl font-semibold u-text-gray-900">
        {{ filteredRepositories.length }} repositor{{ filteredRepositories.length > 1 ? 'ies' : 'y' }} found
      </h2>

      <CommunityRepositoriesFilterSort />
    </div>

    <ul v-if="filteredRepositories.length" class="grid grid-cols-1 gap-8 mt-8 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
      <li v-for="(filteredRepository, index) in filteredRepositories" :key="index">
        <CommunityRepositoriesListItem :repository="filteredRepository" />
      </li>
    </ul>
  </DocsPage>
</template>

<script setup lang="ts">
const { repositories, selectedSort, selectedOrganization, q } = useCommunityRepositories()

const filteredRepositories = computed(() => {
  return [...repositories.value]
    .filter((repo) => {
      if (selectedOrganization.value && repo.owner.login !== selectedOrganization.value.key) {
        return false
      }
      if (q.value && !['name', 'description'].map(field => repo[field]).filter(Boolean).some(value => value.search(new RegExp(q.value as string, 'i')) !== -1)) {
        return false
      }

      return true
    })
    .sort((a, b) => {
      if (['updatedAt', 'createdAt'].includes(selectedSort.value.key)) {
        return Date.parse(b[selectedSort.value.key]) - Date.parse(a[selectedSort.value.key])
      }
      return b[selectedSort.value.key] - a[selectedSort.value.key]
    })
})
</script>
