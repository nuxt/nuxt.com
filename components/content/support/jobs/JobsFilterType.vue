<template>
  <USelectCustom
    v-model="type"
    name="type"
    :options="typesWithPlaceholder"
    size="sm"
    placeholder="Type"
    class="min-w-[128px]"
    text-attribute="label"
  />
</template>

<script setup lang="ts">
import type { PropType } from 'vue'

const props = defineProps({
  types: {
    type: Array as PropType<{key: string, label: string}[]>,
    default: () => []
  },
  selectedType: {
    type: Object as PropType<{ key: string, label: string}>,
    default: () => {}
  }
})

const emit = defineEmits(['update:type'])

const typesWithPlaceholder = computed(() => [
  {
    key: '',
    label: 'All'
  },
  ...props.types
])

const type = computed({
  get () {
    return props.selectedType
  },
  set (type) {
    emit('update:type', type)
  }
})
</script>
