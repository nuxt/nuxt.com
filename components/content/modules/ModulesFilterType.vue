<template>
  <AppSelect
    v-model="type"
    name="type"
    :options="typesWithPlaceholder"
    size="sm"
    placeholder="Type"
    text-attribute="title"
    class="min-w-[144px]"
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
    default: () => {}
  }
})

const emit = defineEmits(['update:selected-type'])

const typesWithPlaceholder: ComputedRef<(FilterItem | {
    key: string;
    title: string;
})[]> = computed(() => [
  {
    key: '',
    title: 'All'
  },
  ...props.types
])

const type: WritableComputedRef<FilterItem | null> = computed({
  get () {
    return props.selectedType
  },
  set (type) {
    emit('update:selected-type', type)
  }
})
</script>
