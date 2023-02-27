<template>
  <AppSelect
    v-model="version"
    name="version"
    :options="versions"
    :size="size"
    text-attribute="key"
    class="app-select-modules-version"
  />
</template>

<script setup lang="ts">
import type { PropType, WritableComputedRef } from 'vue'
import type { FilterItem, Select } from 'types'

const props = defineProps({
  size: {
    type: String as PropType<Select['size']>,
    default: 'xs'
  },
  versions: {
    type: Array as PropType<FilterItem[]>,
    default: () => []
  },
  selectedVersion:
  {
    type: Object as PropType<FilterItem>,
    default: () => ({})
  }
})

const emit = defineEmits(['update:selected-version'])

const version: WritableComputedRef<FilterItem> = computed({
  get () {
    return props.selectedVersion
  },
  set (version) {
    emit('update:selected-version', version)
  }
})
</script>

<style lang="ts">
css({
  '.app-select-modules-version': {
    paddingRight: '{space.0}',

    '@lg': {
      paddingRight: '{space.4}',
    }
  }
})
</style>
