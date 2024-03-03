<script setup lang="ts">
const props = defineProps<{
  name: string
  background: string
}>()

const { copy } = useCopyToClipboard()

function copyLink () {
  copy(props.background, { title: 'Copied to clipboard' })
}
</script>

<template>
  <div class="not-prose">
    <UCard class="p-16 sm:p-16" :style="{ background }" />

    <div class="flex items-center justify-between pt-2">
      <h5 class="font-semibold text-gray-900 dark:text-white text-base">
        {{ name }}
      </h5>
      <UButton variant="link" label="Copy" size="sm" @click="copyLink" />
    </div>
    <p class="text-gray-500 dark:text-gray-400 text-sm">
      {{ background }}
    </p>
  </div>
</template>
