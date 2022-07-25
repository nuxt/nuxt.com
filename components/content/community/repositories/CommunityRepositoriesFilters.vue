<template>
  <div v-if="filters.length" class="flex items-center gap-1.5">
    <UButton
      v-for="filter of filters"
      :key="filter.key"
      :label="filter.title"
      :to="filter.to"
      icon="uil:multiply"
      variant="gray"
      trailing
      rounded
      size="sm"
    />
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { selectedOrganization, q } = useCommunityRepositories()

const filters = computed(() => {
  return [selectedOrganization.value, q.value && {
    key: 'q',
    title: q.value,
    to: {
      name: 'community-repositories',
      query: {
        ...route.query,
        q: undefined
      },
      params: {
        stop: 'true'
      }
    }
  }].filter(Boolean)
})
</script>
