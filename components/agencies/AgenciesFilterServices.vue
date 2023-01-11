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
import { PropType } from 'vue'

const props = defineProps({
  services: {
    type: Array as PropType<{key: string, title: string}[]>,
    default: () => []
  },
  selectedService: {
    type: Object as PropType<{key: string, title: string}>,
    default: () => {}
  }
})

const emit = defineEmits(['update:selectedService'])

const servicesWithPlaceholder = computed(() => [
  {
    key: '',
    title: 'All'
  },
  ...props.services
])

const service = computed({
  get () {
    return props.selectedService
  },
  set (service) {
    emit('update:selectedService', service)
  }
})
</script>
