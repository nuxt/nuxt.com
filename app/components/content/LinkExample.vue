<template>
  <ProseCallout icon="lucide-app-window-mac">
    Read and edit a live example in
    <NuxtLink :to="to">
      {{ computedTitle }}
    </NuxtLink>.
  </ProseCallout>
</template>

<script setup lang="ts">
import type { ComputedRef } from 'vue'

const props = defineProps<{
  to: string
  title?: string
}>()

const computedTitle: ComputedRef<string> = computed(() => createBreadcrumb(props.to))
</script>
