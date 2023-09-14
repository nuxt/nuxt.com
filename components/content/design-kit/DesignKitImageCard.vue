<script setup lang="ts">
defineProps<{
  name: string
  path: string
  background?: string
  full?: boolean
}>()
</script>

<template>
  <div class="not-prose">
    <UCard :ui="{ shadow: '', background: '', body: { padding: full ? 'p-11 sm:p-11' : 'p-8 sm:p-8' } }" :class="background">
      <img :src="`/assets/design-kit/${path}.svg`" :alt="name" class="mx-auto" :class="full ? 'h-10' : 'h-16'">
    </UCard>

    <div class="flex items-center justify-between pt-2">
      <h5 class="font-semibold text-gray-900 dark:text-white text-base">
        {{ name }}
      </h5>

      <div class="flex items-center">
        <UButton
          variant="link"
          label="svg"
          size="sm"
          :to="`/assets/design-kit/${path}.svg`"
          download
          external
          aria-label="Download svg"
        />
        <UButton
          variant="link"
          label="png"
          size="sm"
          :to="`/assets/design-kit/${path}.png`"
          download
          external
          aria-label="Download png"
        />
      </div>
    </div>
  </div>
</template>
