<template>
  <DocsPage id="smooth" :sticky="false">
    <template #aside>
      <CommunityRepositoriesAside />
    </template>

    <div class="flex items-center justify-between">
      <h2 class="flex items-end gap-3 text-3xl font-semibold u-text-gray-900">
        {{ selectedOrganization?.title || 'All' }}

        <span class="text-base font-normal u-text-gray-400">
          {{ filteredRepositories.length }} repositor{{ filteredRepositories.length > 1 ? 'ies' : 'y' }} found
        </span>
      </h2>

      <CommunityRepositoriesFilterSort />
    </div>

    <div class="hidden _ellipse lg:block" />

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
