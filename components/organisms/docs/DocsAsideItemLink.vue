<template>
  <ULink
    :to="link.to"
    active-class="font-semibold u-text-gray-900 u-border-gray-900"
    inactive-class="font-medium u-text-gray-400 u-border-gray-200"
    exact
  >
    {{ link.label }}
  </ULink>
</template>

<script setup lang="ts">
defineProps({
  link: {
    type: Object,
    required: true
  }
})
</script>
