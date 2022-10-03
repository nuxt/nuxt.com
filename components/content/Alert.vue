<script setup lang="ts">
const props = defineProps({
  /**
       * @values info, success, warning, danger
       */
  type: {
    type: String,
    default: 'info',
    validator (value: string) {
      return ['info', 'success', 'warning', 'danger'].includes(value)
    }
  }
})

const variantClass = computed(() => {
  return ({
    info: 'bg-blue-500',
    success: 'bg-green-500',
    warning: 'bg-orange-500',
    danger: 'bg-red-500'
  })[props.type]
})
</script>

<template>
  <div class="alert mt-4 mb-4 rounded-xl px-4 py-3 text-sm leading-relaxed" :class="[variantClass]">
    <div class="flex items-start">
      <div class="alert-content flex-grow">
        <ContentSlot :use="$slots.default" unwrap="p" />
      </div>
    </div>
  </div>
</template>
