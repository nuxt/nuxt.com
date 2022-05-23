<template>
  <div class="flex items-center gap-1.5">
    <UButton
      v-for="filter of filters"
      :key="filter.key"
      :label="filter.title"
      :to="filter.to"
      icon="heroicons-outline:x"
      variant="gray"
      trailing
      rounded
      size="sm"
    />
  </div>
</template>

<script setup lang="ts">
const { selectedCategory, selectedService } = useCommunityPartners()

const filters = computed(() => {
  return [selectedCategory.value, selectedService.value].filter(Boolean)
})
</script>
