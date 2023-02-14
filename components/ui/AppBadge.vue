<template>
  <span :class="badgeClass">
    <slot>{{ label }}</slot>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { classNames } from '../../utils'
import { uiPreset } from '../../ui/preset'

const props = defineProps({
  size: {
    type: String,
    default: 'md',
    validator (value: string) {
      return Object.keys(uiPreset.badge.size).includes(value)
    }
  },
  variant: {
    type: String,
    default: 'primary',
    validator (value: string) {
      return Object.keys(uiPreset.badge.variant).includes(value)
    }
  },
  baseClass: {
    type: String,
    default: () => uiPreset.badge.base
  },
  rounded: {
    type: Boolean,
    default: false
  },
  label: {
    type: String,
    default: null
  }
})

const badgeClass = computed(() => {
  return classNames(
    props.baseClass,
    uiPreset.badge.size[props.size],
    uiPreset.badge.variant[props.variant],
    props.rounded ? 'rounded-full' : 'rounded-md'
  )
})
</script>

<script lang="ts">
export default { name: 'UBadge' }
</script>
