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
const route = useRoute()
const { selectedCategory, selectedType, q } = useIntegrations()

const filters = computed(() => {
  return [
    selectedCategory.value,
    selectedType.value && {
      ...selectedType.value,
      to: {
        name: 'integrations',
        query: {
          ...route.query,
          type: route.query?.type !== selectedType.value.key ? selectedType.value.key : undefined
        },
        params: { smooth: '#smooth' }
      }
    },
    q.value && {
      key: 'q',
      title: q.value,
      to: {
        name: 'integrations',
        query: {
          ...route.query,
          q: undefined
        },
        params: {
          stop: 'true'
        }
      }
    }
  ].filter(Boolean)
})
</script>
