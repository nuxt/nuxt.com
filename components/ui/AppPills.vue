<template>
  <nav :class="wrapperClass">
    <AppLink
      v-for="(link, index) of links"
      :key="index"
      :to="link.to"
      :exact="link.exact"
      :class="baseClass"
      :active-class="activeClass"
      :inactive-class="inactiveClass"
    >
      {{ link.label }}
    </AppLink>
  </nav>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { RouteLocationNormalized } from 'vue-router'
import { uiPreset } from '../../ui/preset'

defineProps({
  links: {
    type: Array as PropType<{ to: RouteLocationNormalized | string, exact: boolean, label: string }[]>,
    required: true
  },
  wrapperClass: {
    type: String,
    default: () => uiPreset.pills.wrapper
  },
  baseClass: {
    type: String,
    default: () => uiPreset.pills.base
  },
  activeClass: {
    type: String,
    default: () => uiPreset.pills.active
  },
  inactiveClass: {
    type: String,
    default: () => uiPreset.pills.inactive
  }
})
</script>
