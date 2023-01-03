<template>
  <USelectCustom
    v-model="type"
    name="type"
    :options="typesWithPlaceholder"
    size="sm"
    placeholder="Type"
    text-attribute="title"
    class="min-w-[144px]"
  />
</template>

<script setup lang="ts">
import type { PropType } from 'vue'

interface Type {
  key: string
  title: string
  to: object
}

const props = defineProps({
  types: {
    type: Array as PropType<Type[]>,
    default: () => []
  },
  selectedType: {
    type: Object as PropType<Type>,
    default: () => {}
  }
})

const emit = defineEmits(['update:selected-type'])

const typesWithPlaceholder = computed(() => [
  {
    key: '',
    title: 'All'
  },
  ...props.types
])

const type = computed({
  get () {
    return props.selectedType
  },
  set (type) {
    emit('update:selected-type', type)
  }
})
</script>
