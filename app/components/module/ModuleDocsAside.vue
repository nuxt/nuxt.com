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
      :ui="{ link: 'data-[state=open]:text-muted data-[state=open]:hover:text-highlighted', trigger: 'font-normal' }"
      highlight
    />
  </UPageAside>
</template>
