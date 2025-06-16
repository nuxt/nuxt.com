<script setup lang="ts">
interface Props {
  icon: string
  iconColor?: string
  value: number | string
  label: string
  description: string
  descriptionColor?: string
}

withDefaults(defineProps<Props>(), {
  iconColor: 'text-primary',
  descriptionColor: 'text-muted'
})
</script>

<template>
  <div class="text-center p-4 bg-muted/30 rounded-lg">
    <UIcon :name="icon" :class="`size-6 ${iconColor} mx-auto mb-2`" />
    <div class="text-2xl font-bold mb-1">
      {{ value }}
    </div>
    <div class="text-sm text-muted mb-1">
      {{ label }}
    </div>
    <div :class="`text-xs ${descriptionColor}`">
      {{ description }}
    </div>
  </div>
</template>
