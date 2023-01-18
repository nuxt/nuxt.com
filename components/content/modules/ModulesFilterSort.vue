<template>
  <div class="inline-flex w-full md:w-auto">
    <UButton
      name="orderBy"
      :icon="orderBy.icon"
      size="sm"
      variant="input-group"
      icon-base-class="flex-shrink-0 u-text-gray-400 group-hover:u-text-gray-500"
      class="-mr-px rounded-r-none focus:z-[1] group"
      @click="switchOrder"
    />
    <USelectCustom
      v-model="sortBy"
      name="sortBy"
      :options="sorts"
      size="sm"
      text-attribute="title"
      custom-class="rounded-l-none"
      class="min-w-[144px] w-full md:w-auto"
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
