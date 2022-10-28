<template>
  <div class="inline-flex w-full md:w-auto">
    <UButton
      label="A-Z"
      size="sm"
      variant="input-group"
      trailing-icon="ic:round-keyboard-arrow-down"
      icon-base-class="
      flex-shrink-0
      u-text-gray-400
      group-hover:u-text-gray-500"
      class="-mr-px rounded focus:z-[1] group"
      @click="switchOrder"
    />
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()

const { orders, selectedOrder } = useModules()

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
