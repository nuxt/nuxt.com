<script setup lang="ts">
import { TransitionPresets, useTransition } from '@vueuse/core'

const props = withDefaults(defineProps<{
  value: number
  duration?: number
}>(), {
  duration: 900
})

// Starts at 0 so the number counts up on mount, then follows every change of `value`
const source = ref(0)
onMounted(() => {
  watch(() => props.value, (value) => {
    source.value = value
  }, { immediate: true })
})

const output = useTransition(source, {
  duration: computed(() => props.duration),
  transition: TransitionPresets.easeOutCubic
})

const { format } = new Intl.NumberFormat('en-US')
</script>

<template>
  <span class="tabular-nums">{{ format(Math.round(output)) }}</span>
</template>
