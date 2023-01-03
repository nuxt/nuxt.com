<template>
  <UInput
    v-model="query"
    name="search"
    placeholder="Search an integration"
    class="w-full md:max-w-sm"
    :size="size"
    autocomplete="off"
    :trailing="size === 'sm'"
  />
</template>

<script setup lang="ts">
import type { PropType } from 'vue'

const props = defineProps({
  size: {
    type: String as PropType<'xs' | 'sm' | 'lg'>,
    default: 'lg'
  },
  q: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:q'])

const query = computed({
  get () {
    return props.q
  },
  set (query) {
    emit('update:q', query)
  }
})
</script>
