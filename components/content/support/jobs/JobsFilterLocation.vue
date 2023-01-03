<template>
  <USelectCustom
    v-model="location"
    name="location"
    :options="locationsWithPlaceholder"
    size="sm"
    placeholder="Location"
    class="min-w-[192px]"
  />
</template>

<script setup lang="ts">
import type { PropType } from 'vue'

const props = defineProps({
  locations: {
    type: Array as PropType<{value: string, text: string}[]>,
    default: () => []
  },
  selectedLocation: {
    type: Object as PropType<{ value: string, text: string}>,
    default: () => {}
  }
})

const emit = defineEmits(['update:location'])

const locationsWithPlaceholder = computed(() => [
  {
    value: '',
    text: 'All'
  },
  ...props.locations
])

const location = computed({
  get () {
    return props.selectedLocation
  },
  set (location) {
    emit('update:location', location)
  }
})
</script>
