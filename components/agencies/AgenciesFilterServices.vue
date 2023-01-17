<template>
  <USelectCustom
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
import { AgencyService } from 'types'

const props = defineProps({
  services: {
    type: Array as PropType<AgencyService[]>,
    default: () => []
  },
  selectedService: {
    type: Object as PropType<AgencyService>,
    default: () => { }
  }
})

const emit = defineEmits(['update:selectedService'])

const servicesWithPlaceholder: ComputedRef<(AgencyService | {
  key: string
  title: string
})[]> = computed(() => [
  {
    key: '',
    title: 'All'
  },
  ...props.services
])

const service: WritableComputedRef<AgencyService> = computed({
  get () {
    return props.selectedService
  },
  set (service: AgencyService) {
    emit('update:selectedService', service)
  }
})
</script>
