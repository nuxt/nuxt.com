<template>
  <div class="inline-flex w-full md:w-auto">
    <AppButton
      name="orderBy"
      :icon="orderBy.icon"
      size="xs"
      variant="input-group"
      class="order-button"
      @click="switchOrder"
    />
    <AppSelect
      v-model="sortBy"
      name="sortBy"
      :options="sorts"
      size="sm"
      text-attribute="title"
      class="app-select-modules-sort"
    />
  </div>
</template>

<script setup lang="ts">
import type { PropType, WritableComputedRef } from 'vue'
import type { FilterItem } from 'types'

const props = defineProps({
  sorts: {
    type: Array as PropType<FilterItem[]>,
    required: true
  },
  selectedSort: {
    type: Object as PropType<FilterItem>,
    required: true
  },
  orders: {
    type: Array as PropType<FilterItem[]>,
    required: true
  },
  selectedOrder: {
    type: Object as PropType<FilterItem>,
    required: true
  }
})

const emit = defineEmits(['update:sortBy', 'update:orderBy'])

const sortBy: WritableComputedRef<FilterItem> = computed({
  get () {
    return props.selectedSort
  },
  set (sortBy) {
    emit('update:sortBy', sortBy)
  }
})

const orderBy: WritableComputedRef<FilterItem> = computed({
  get () {
    return props.selectedOrder
  },
  set (orderBy: FilterItem) {
    emit('update:orderBy', orderBy)
  }
})

function switchOrder () {
  const otherOrder: FilterItem | null = props.orders.find(order => order.key !== orderBy.value.key) || null
  orderBy.value = otherOrder as FilterItem
}
</script>

<style lang="ts">
css({
  '.app-select-modules-sort': {
    minWidth: '144px',
    width: '{size.full}',

    '@md': {
      width: 'auto'
    },

    '> div': {
      '> button': {
        borderTopLeftRadius: '{radii.none} !important',
        borderBottomLeftRadius: '{radii.none} !important',
      }
    },
  },
  '.order-button': {
    borderTopRightRadius: '0px',
    borderBottomRightRadius: '0px',
    marginRight: '-1px',
    ringColor: '{color.transparent} !important',
    ringOffsetColor: '{color.transparent} !important',

    '&:focus': {
      zIndex: '1',
    },

    '> .icon': {
      flexShrink: 0,
    },

    ':deep(svg)': {
      color: '{color.gray.600}',

      '@dark': {
        color: '{color.gray.300}'
      }
    }
  }
})
</style>
