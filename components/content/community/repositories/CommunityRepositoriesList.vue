<template>
  <Page id="smooth" class="pt-16 -mt-16">
    <template #aside>
      <CommunityRepositoriesAside />
    </template>

    <PageList :title="`${filteredRepositories.length} repositor${filteredRepositories.length > 1 ? 'ies' : 'y'} found`">
      <template #filters>
        <CommunityRepositoriesFilterSearch size="sm" class="md:hidden" />
        <CommunityRepositoriesFilters class="hidden lg:flex" />
        <CommunityRepositoriesFilterOrganization class="lg:hidden" />
        <CommunityRepositoriesFilterSort />
      </template>

      <ul v-if="displayedRepositories.length" class="grid grid-cols-1 gap-8 mt-8 sm:grid-cols-2 xl:grid-cols-3">
        <li v-for="(displayedRepository, index) in displayedRepositories" :key="index">
          <CommunityRepositoriesListItem :repository="displayedRepository" />
        </li>
      </ul>
      <div v-else class="relative flex flex-col items-center gap-6 mt-16 lg:mt-24">
        <UIcon name="fa-brands:github" class="w-16 h-16 u-text-gray-600" />
        <span class="text-xl font-medium text-center u-text-gray-700">
          There is no repositories for <b>{{ q }}</b> yet.
        </span>
      </div>
    </PageList>
  </Page>
</template>

<script setup lang="ts">
import { useEventListener } from '@vueuse/core'
import { searchTextRegExp } from '~/utils'
const { repositories, selectedSort, selectedOrder, selectedOrganization, q } = useCommunityRepositories()

const ITEMS_TO_LOAD = 24

const filteredRepositories = computed(() => {
  let filteredRepositories = [...repositories.value]
    .filter((repo) => {
      if (selectedOrganization.value && repo.owner.login !== selectedOrganization.value.key) {
        return false
      }
      const queryRegExp = searchTextRegExp(q.value as string)
      if (q.value && !['name', 'description'].map(field => repo[field]).filter(Boolean).some(value => value.search(queryRegExp) !== -1)) {
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

  if (selectedOrder.value.key === 'asc') {
    filteredRepositories = filteredRepositories.reverse()
  }

  return filteredRepositories
})

const displayedRepositories = ref(filteredRepositories.value.slice(0, ITEMS_TO_LOAD))

watch([selectedOrganization, selectedSort, selectedOrder, q], () => {
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
