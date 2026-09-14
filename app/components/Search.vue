<script setup lang="ts">
import type { NavigationItem } from 'comark-content'

defineProps<{
  navigation?: NavigationItem[]
}>()

const { search, status } = useSearch()
const { searchGroups, searchLinks, searchTerm } = useNavigation()
</script>

<template>
  <UContentSearch
    v-model:search-term="searchTerm"
    :links="searchLinks"
    :groups="searchGroups"
    :navigation="navigation"
    :search="search"
    :search-status="status"
    :loading="status === 'loading'"
    :fuse="{ resultLimit: 25 }"
    :transition="false"
  />
</template>
