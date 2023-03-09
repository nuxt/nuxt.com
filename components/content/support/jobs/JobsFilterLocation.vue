<template>
  <AppSelect
    v-model="location"
    name="location"
    :options="locationsWithPlaceholder"
    size="sm"
    placeholder="Location"
    class="app-select-jobs-location"
    text-attribute="title"
  />
</template>

<script setup lang="ts">
import type { PropType, WritableComputedRef, ComputedRef } from 'vue'
import type { FilterItem } from 'types'

const props = defineProps({
  locations: {
    type: Array as PropType<FilterItem[]>,
    default: () => []
  },
  selectedLocation: {
    type: Object as PropType<FilterItem | null>,
    default: () => ({})
  }
})

const emit = defineEmits(['update:location'])

const locationsWithPlaceholder: ComputedRef<FilterItem[]> = computed(() => [
  {
    key: '',
    title: 'All'
  },
  ...props.locations
])

const location: WritableComputedRef<any> = computed({
  get () {
    return props.selectedLocation
  },
  set (location) {
    emit('update:location', location)
  }
})
</script>

<style lang="ts">
css({
  '.app-select-jobs-location': {
    minWidth: '192px'
  }
})
</style>
