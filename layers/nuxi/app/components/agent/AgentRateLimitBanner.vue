<script setup lang="ts">
const props = withDefaults(defineProps<{
  variant?: 'centered' | 'sticky' | 'footer'
}>(), {
  variant: 'centered'
})

const classes = computed(() => {
  switch (props.variant) {
    case 'sticky':
      return 'sticky bottom-0 flex items-center justify-center gap-2 py-4 text-sm text-muted'
    case 'footer':
      return 'flex items-center gap-2 px-4 py-3 text-sm text-muted'
    default:
      return 'flex items-center justify-center gap-2 py-4 text-sm text-muted'
  }
})
</script>

<template>
  <div :class="classes">
    <UIcon name="i-lucide-clock" class="size-4 shrink-0" />
    <span>Daily limit reached. Try again tomorrow.</span>
  </div>
</template>
