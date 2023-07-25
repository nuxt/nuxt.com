<template>
  <AppSelect
    v-if="regions.length"
    v-model="region"
    name="region"
    :options="regionsWithPlaceholder"
    size="sm"
    placeholder="Region"
    text-attribute="title"
    class="app-select-agencies-region"
  />
</template>

<script setup lang="ts">
import { PropType, WritableComputedRef, ComputedRef } from 'vue'
import type { FilterItem } from 'types'

const props = defineProps({
  regions: {
    type: Array as PropType<FilterItem[]>,
    default: () => []
  },
  selectedRegion: {
    type: Object as PropType<FilterItem | null>,
    default: () => ({})
  }
})

const emit = defineEmits(['update:selectedRegion'])

const regionsWithPlaceholder: ComputedRef<(FilterItem | {
  key: string
  title: string
})[]> = computed(() => [
  {
    key: '',
    title: 'All'
  },
  ...props.regions
])

const region: WritableComputedRef<any> = computed({
  get () {
    return props.selectedRegion
  },
  set (region) {
    emit('update:selectedRegion', region)
  }
})
</script>

<style lang="ts">
css({
  '.app-select-agencies-region': {
    minWidth: '144px'
  }
})
</style>
