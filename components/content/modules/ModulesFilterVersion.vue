<template>
  <USelectCustom
    v-model="version"
    name="version"
    :options="versions"
    :size="size"
    text-attribute="key"
    appearance="invert"
    class="custom-class"
    icon-base-class="text-black"
    list-base-class="absolute right-0 z-10 w-full p-1 mt-1 overflow-auto text-sm rounded-md shadow-lg sm:w-32 u-bg-black max-h-60 ring-1 u-ring-white"
    list-option-active-class="bg-gray-100 u-text-gray-900 dark:bg-gray-900"
    list-option-inactive-class="u-text-gray-50"
  />
</template>

<script setup lang="ts">
import type { PropType, WritableComputedRef } from 'vue'
import type { FilterItem } from 'types'

const props = defineProps({
  size: {
    type: String as PropType<'xs' | 'sm'>,
    default: 'xs'
  },
  versions: {
    type: Array as PropType<FilterItem[]>,
    default: () => []
  },
  selectedVersion:
  {
    type: Object as PropType<FilterItem>,
    default: () => {}
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

<style lang="postcss">
.custom-class > div > button > span {
  @apply text-black
}
</style>
