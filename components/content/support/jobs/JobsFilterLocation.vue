<template>
  <USelectCustom
    v-model="location"
    name="location"
    :options="locationsWithPlaceholder"
    size="sm"
    placeholder="Location"
    class="min-w-[192px]"
    text-attribute="label"
  />
</template>

<script setup lang="ts">
import type { PropType } from 'vue'

const props = defineProps({
  locations: {
    type: Array as PropType<{key: string, label: string}[]>,
    default: () => []
  },
  selectedLocation: {
    type: Object as PropType<{ key: string, label: string}>,
    default: () => {}
  }
})

const emit = defineEmits(['update:location'])

const locationsWithPlaceholder = computed(() => [
  {
    key: '',
    label: 'All'
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
