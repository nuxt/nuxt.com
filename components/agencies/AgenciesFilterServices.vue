<template>
  <AppSelect
    v-if="services.length"
    v-model="service"
    name="service"
    :options="servicesWithPlaceholder"
    size="sm"
    placeholder="Service"
    text-attribute="title"
    class="min-w-[144px]"
  />
</template>

<script setup lang="ts">
import { PropType, WritableComputedRef, ComputedRef } from 'vue'
import { FilterItem } from 'types'

const props = defineProps({
  services: {
    type: Array as PropType<FilterItem[]>,
    default: () => []
  },
  selectedService: {
    type: Object as PropType<FilterItem | null>,
    default: () => {}
  }
})

const emit = defineEmits(['update:selectedService'])

const servicesWithPlaceholder: ComputedRef<(FilterItem | {
  key: string
  title: string
})[]> = computed(() => [
  {
    key: '',
    title: 'All'
  },
  ...props.services
])

const service: WritableComputedRef<any> = computed({
  get () {
    return props.selectedService as FilterItem
  },
  set (service: FilterItem) {
    emit('update:selectedService', service)
  }
})
</script>
