
<template>
  <ul class="flex flex-col sm:flex-row gap-x-10">
    <li
      v-for="item of list"
      :key="item.label"
      class="flex flex-row gap-1 mt-8"
    >
      <Icon :name="item.icon" class="w-6 h-6" />

      <p>
        {{ item.label }}
      </p>
    </li>
  </ul>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'

interface Item {
  icon: string
  label: string
}

defineProps({
  list: {
    type: Array as PropType<Array<Item>>,
    default: () => []
  }
})
</script>
