<template>
  <AppSelect
    v-model="type"
    name="type"
    :options="typesWithPlaceholder"
    size="sm"
    placeholder="Type"
    class="app-select-jobs-type"
    text-attribute="title"
  />
</template>

<script setup lang="ts">
import type { PropType, ComputedRef, WritableComputedRef } from 'vue'
import type { FilterItem } from 'types'

const props = defineProps({
  types: {
    type: Array as PropType<FilterItem[]>,
    default: () => []
  },
  selectedType: {
    type: Object as PropType<FilterItem | null>,
    default: () => ({})
  }
})

const emit = defineEmits(['update:type'])

const typesWithPlaceholder: ComputedRef<FilterItem[]> = computed(() => [
  {
    key: '',
    title: 'All'
  },
  ...props.types
])

const type: WritableComputedRef<any> = computed({
  get () {
    return props.selectedType
  },
  set (type) {
    emit('update:type', type)
  }
})
</script>

<style lang="ts">
css({
  'app-select-jobs-type': {
    minWidth: '128px'
  }
})
</style>
