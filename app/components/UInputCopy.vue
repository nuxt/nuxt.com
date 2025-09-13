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
    type: String as PropType<'lg' | 'xl'>,
    default: 'lg'
  }
})
const { copy, copied } = useClipboard()
</script>

<template>
  <label>
    <UInput
      class="w-full"
      :model-value="label ? label : value"
      :size="size"
      disabled
      icon="i-lucide-terminal"
      :ui="{
        base: copied ? 'ring-primary' : ''
      }"
    >
      <div class="absolute inset-0" :class="[copied ? 'cursor-default' : 'cursor-copy']" @click="copy(value)" />
      <template #trailing>
        <UButton
          :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
          color="neutral"
          variant="link"
          :padded="false"
          :class="{
            '!text-primary cursor-default': copied,
            'cursor-copy': !copied
          }"
          aria-label="copy button"
          @click="copy(value)"
        />
      </template>
    </UInput>
  </label>
</template>
