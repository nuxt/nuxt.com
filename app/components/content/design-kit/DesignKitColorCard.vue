<script setup lang="ts">
const props = defineProps<{
  name: string
  background: string
}>()

const { copy } = useClipboard()

function copyLink() {
  copy(props.background, {
    title: 'Copied to clipboard',
    icon: 'i-lucide-copy-check'
  })
}
</script>

<template>
  <div>
    <UCard class="p-16 sm:p-16" :style="{ background }" />

    <div class="flex items-center justify-between pt-2">
      <h5 class="font-semibold text-(--ui-text-highlighted) text-base">
        {{ name }}
      </h5>
      <UButton variant="link" label="Copy" size="sm" @click="copyLink" />
    </div>
    <p class="text-(--ui-text-muted) text-sm">
      {{ background }}
    </p>
  </div>
</template>
