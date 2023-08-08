<script setup lang="ts">
import type { Button } from '@nuxthq/ui/dist/runtime/types'

defineProps<{
  avatar: {
    src: string
    width: string
    height: string
    alt: string
  }
  cta: Button
}>()
</script>

<template>
  <UPageCard class="prose dark:prose-invert max-w-none" :ui="{ title: 'my-0 text-lg' }">
    <template #icon>
      <UAvatar v-bind="avatar" size="xl" />
    </template>

    <template v-if="$slots.title" #title>
      <ContentSlot unwrap="p" :use="$slots.title" />
    </template>

    <template v-if="$slots.description" #description>
      <ContentSlot unwrap="p" :use="$slots.description" />
    </template>

    <ContentSlot unwrap="p" :use="$slots.default" />

    <div class="not-prose">
      <UButton v-if="cta" v-bind="{ color: 'white', size: 'lg', ...cta }" />
    </div>
  </UPageCard>
</template>
