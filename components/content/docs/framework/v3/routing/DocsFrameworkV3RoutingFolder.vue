<template>
  <div>
    <div class="flex items-center font-medium text-gray-100 gap-x-1">
      <Icon :name="chevronDown ? 'uil:angle-down' : 'uil:angle-right'" class="w-5 h-5 mt-1" />
      <slot />
    </div>
    <div v-if="line" class="absolute w-0.5 bg-gradient-to-b from-gray-400 to-transparent" :class="lineClass" />
  </div>
</template>

<script setup lang="ts">
defineProps({
  chevronDown: {
    type: Boolean,
    default: false
  },
  line: {
    type: Boolean,
    default: false
  },
  lineClass: {
    type: String,
    default: 'inset-y-0 bottom-8 left-2 top-8 '
  }
})
</script>
