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
const route = useRoute()
const router = useRouter()

const { sorts, selectedSort, orders, selectedOrder } = useCommunityRepositories()

const sortBy = computed({
  get () {
    return selectedSort.value
  },
  set (sortBy: { key: string, label: string }) {
    router.push({
      name: 'community-repositories',
      query: {
        ...route.query,
        sortBy: sortBy?.key || undefined
      },
      state: {
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
      name: 'community-repositories',
      query: {
        ...route.query,
        orderBy: orderBy?.key || undefined
      },
      state: {
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
