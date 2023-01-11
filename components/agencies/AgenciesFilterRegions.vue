<template>
  <USelectCustom
    v-if="regions.length"
    v-model="region"
    name="region"
    :options="regionsWithPlaceholder"
    size="sm"
    placeholder="Region"
    text-attribute="title"
    class="min-w-[144px]"
  />
</template>

<script setup lang="ts">
import { PropType } from 'vue'

const props = defineProps({
  regions: {
    type: Array as PropType<{key: string, title: string}[]>,
    default: () => []
  },
  selectedRegion: {
    type: Object as PropType<{key: string, title: string}>,
    default: () => {}
  }
})

const emit = defineEmits(['update:selectedRegion'])

const regionsWithPlaceholder = computed(() => [
  {
    key: '',
    title: 'All'
  },
  ...props.regions
])

const region = computed({
  get () {
    return props.selectedRegion
  },
  set (region) {
    emit('update:selectedRegion', region)
  }
})
</script>
