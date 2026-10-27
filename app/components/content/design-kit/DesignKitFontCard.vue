<script setup lang="ts">
defineProps<{
  name: string
  usage: string
  font: string
  to: string
}>()
</script>

<template>
  <div class="not-prose">
    <UCard :ui="{ body: 'p-8 sm:p-8' }">
      <p class="text-7xl font-medium text-highlighted" :class="font">
        Aa
      </p>
      <p class="mt-8 text-lg text-muted truncate" :class="font">
        ABCDEFGHIJKLMNOPQRSTUVWXYZ
      </p>
      <p class="text-lg text-muted truncate" :class="font">
        abcdefghijklmnopqrstuvwxyz 0123456789
      </p>
    </UCard>

    <div class="flex items-center justify-between pt-2">
      <h5 class="text-highlighted text-base">
        {{ name }}
      </h5>
      <UButton
        variant="link"
        label="Google Fonts"
        size="sm"
        :to="to"
        target="_blank"
        trailing-icon="i-lucide-arrow-up-right"
      />
    </div>
    <p class="text-muted text-sm">
      {{ usage }}
    </p>
  </div>
</template>
