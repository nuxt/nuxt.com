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
const partnerType: 'technologies' | 'agencies' = inject('partnerType')

const { selectedService, selectedLocation } = useCommunityPartners(partnerType)

const filters = computed(() => {
  return [selectedService.value, selectedLocation.value].filter(Boolean)
})
</script>
