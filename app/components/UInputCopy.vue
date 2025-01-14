<script setup lang="ts">
defineProps({
  value: {
    type: String,
    required: true
  },
  label: {
    type: String,
    required: false
  },
  size: {
    type: String as () => 'lg',
    default: 'lg'
  }
})
const { copy, copied } = useClipboard()
</script>

<template>
  <label>
    <UInput :model-value="label ? label : value" :size="size" disabled :ui="{ icon: { trailing: { pointer: '' } } }" icon="i-ph-terminal">
      <div class="absolute inset-0" :class="[copied ? 'cursor-default' : 'cursor-copy']" @click="copy(value)" />
      <template #trailing>
        <UButton
          :icon="copied ? 'i-ph-check' : 'i-ph-copy'"
          color="gray"
          variant="link"
          :padded="false"
          :class="{ 'text-green-500 hover:text-green-500 dark:text-green-400 hover:dark:text-green-400': copied }"
          aria-label="copy button"
          @click="copy(value)"
        />
      </template>
    </UInput>
  </label>
</template>
