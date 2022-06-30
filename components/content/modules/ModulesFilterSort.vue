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
      icon
      :options="sorts"
      size="sm"
      value-attribute="key"
      text-attribute="label"
      custom-class="rounded-l-none"
      class="min-w-[144px] w-full md:w-auto"
    />
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()

const { sorts, selectedSort, orders, selectedOrder } = useModules()

const sortBy = computed({
  get () {
    return selectedSort.value
  },
  set (sortBy) {
    router.push({
      name: 'modules',
      query: {
        ...route.query,
        sortBy: sortBy?.key || undefined
      },
      params: {
        smooth: '#smooth'
      }
    })
  }
})

const orderBy = computed({
  get () {
    return selectedOrder.value
  },
  set (orderBy: { key: string, label: string, icon: string }) {
    router.push({
      name: 'modules',
      query: {
        ...route.query,
        orderBy: orderBy?.key || undefined
      },
      params: {
        smooth: '#smooth'
      }
    })
  }
})

function switchOrder () {
  const otherOrder = orders.find(order => order.key !== orderBy.value.key)
  orderBy.value = otherOrder
}
</script>
