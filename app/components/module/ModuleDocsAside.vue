<script setup lang="ts">
import type { NavigationItem } from 'comark-content'

defineProps<{
  navigation: NavigationItem[]
}>()
</script>

<template>
  <UPageAside>
    <UContentNavigation
      :navigation="navigation"
      :collapsible="false"
      highlight
    />
  </UPageAside>
</template>
