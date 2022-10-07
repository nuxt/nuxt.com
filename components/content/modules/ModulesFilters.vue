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
const { selectedCategory, selectedType, q } = useModules()

const filters = computed(() => {
  return [
    selectedCategory.value,
    selectedType.value && {
      ...selectedType.value,
      to: {
        name: 'modules',
        query: {
          ...route.query,
          type: route.query?.type !== selectedType.value.key ? selectedType.value.key : undefined
        },
        state: { smooth: '#smooth' }
      }
    },
    q.value && {
      key: 'q',
      title: q.value,
      to: {
        name: 'modules',
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
