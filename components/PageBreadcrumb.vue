<script setup lang="ts">
defineProps({
  links: {
    type: Array as PropType<{ label: string; to: string }[]>,
    required: true
  }
})
</script>

<template>
  <ULink v-for="(link, index) in links" :key="index" :to="link.to" :class="[index < links.length - 1 && 'text-gray-500 dark:text-gray-400']" class="flex items-center gap-1.5 group">
    <span :class="[index < links.length - 1 && 'group-hover:text-gray-700 dark:group-hover:text-gray-200']">{{ link.label }}</span>
    <UIcon v-if="index < links.length - 1" name="i-ph-caret-right" class="w-4 h-4" />
  </ULink>
</template>
