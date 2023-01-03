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
      text-attribute="label"
      custom-class="rounded-l-none"
      class="min-w-[144px] w-full md:w-auto"
    />
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'

const props = defineProps({
  sorts: {
    type: Array as PropType<{ key: string, label: string }[]>,
    required: true
  },
  selectedSort: {
    type: Object as PropType<{ key: string, label: string }>,
    required: true
  },
  orders: {
    type: Array as PropType<{ key: string, label: string, icon: string }[]>,
    required: true
  },
  selectedOrder: {
    type: Object as PropType<{ key: string, label: string, icon: string }>,
    required: true
  }
})

const emit = defineEmits(['update:sortBy', 'update:orderBy'])

const sortBy = computed({
  get () {
    return props.selectedSort
  },
  set (sortBy) {
    emit('update:sortBy', sortBy)
  }
})

const orderBy = computed({
  get () {
    return props.selectedOrder
  },
  set (orderBy: { key: string, label: string, icon: string }) {
    emit('update:orderBy', orderBy)
  }
})

function switchOrder () {
  const otherOrder = props.orders.find(order => order.key !== orderBy.value.key)
  orderBy.value = otherOrder as { key: string, label: string, icon: string }
}
</script>
