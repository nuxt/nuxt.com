<template>
  <Page id="smooth" class="pt-16 -mt-16">
    <template #aside>
      <CommunityRepositoriesAside />
    </template>

    <div class="flex flex-col justify-between gap-3 lg:items-center lg:flex-row">
      <h2 class="text-3xl font-semibold u-text-gray-900">
        {{ filteredRepositories.length }} repositor{{ filteredRepositories.length > 1 ? 'ies' : 'y' }} found
      </h2>

      <div class="flex flex-col gap-3 md:flex-row md:items-center">
        <CommunityRepositoriesFilters class="hidden lg:flex" />
        <CommunityRepositoriesFilterOrganization class="lg:hidden" />
        <CommunityRepositoriesFilterSort />
      </div>
    </div>

    <ul v-if="displayedRepositories.length" class="grid grid-cols-1 gap-8 mt-8 sm:grid-cols-2 xl:grid-cols-3">
      <li v-for="(displayedRepository, index) in displayedRepositories" :key="index">
        <CommunityRepositoriesListItem :repository="displayedRepository" />
      </li>
    </ul>
  </Page>
</template>

<script setup lang="ts">
import { useEventListener } from '@vueuse/core'
const { repositories, selectedSort, selectedOrganization, q } = useCommunityRepositories()

const ITEMS_TO_LOAD = 24

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

const displayedRepositories = ref(filteredRepositories.value.slice(0, ITEMS_TO_LOAD))

watch([selectedOrganization, selectedSort, q], () => {
  displayedRepositories.value = filteredRepositories.value.slice(0, ITEMS_TO_LOAD)
})

onMounted(() => {
  useEventListener(window.document, 'scroll', () => {
    const bottomOfWindow = document.documentElement.scrollTop + window.innerHeight >= document.documentElement.offsetHeight

    if (bottomOfWindow) {
      const length = displayedRepositories.value.length
      displayedRepositories.value.push(...filteredRepositories.value.slice(length, length + ITEMS_TO_LOAD))
    }
  })
})

</script>
