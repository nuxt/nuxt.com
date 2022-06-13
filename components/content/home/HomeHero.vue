<template>
  <UContainer padded class="relative not-prose">
    <div class="flex flex-row items-center justify-between pb-20 pt-36 md:pt-44 lg:pt-36">
      <div class="flex flex-col justify-start gap-y-8">
        <div v-if="$slots.badgeLabel" class="flex gap-x-2">
          <UBadge rounded variant="green">
            <Markdown :use="$slots.badgeLabel" unwrap="p" />
          </UBadge>
          <span class="u-text-gray-800">
            <Markdown :use="$slots.news" unwrap="p" />
          </span>
        </div>
        <h1 v-if="$slots.title" class="max-w-2xl font-bold text-left text-7xl u-text-gray-900">
          <Markdown use="title" unwrap="p" />
        </h1>
        <p v-if="$slots.description" class="w-3/5 text-lg text-left u-text-gray-800">
          <Markdown use="description" unwrap="p" />
        </p>
        <div class="flex gap-x-8">
          <UButton
            v-for="button of buttons"
            :key="button.label"
            :size="button.size || 'xl'"
            :variant="button.variant || 'transparent'"
            :icon="button.icon || undefined"
            :label="button.label || ''"
            :to="button.to || '#'"
            :trailing="button.trailing"
          />
        </div>
      </div>
      <img src="/assets/home/hero-gradient.svg" class="absolute -rotate-[40deg] -top-[200px] -right-[300px] opacity-60 overflow-hidden">
    </div>
  </UContainer>
</template>

<script setup lang="ts">
import { PropType } from 'vue'

defineProps({
  buttons: {
    type: Array as PropType<{ label?: string, variant?: string, to?: string, size?: string, icon?: string, trailing?: Boolean }[]>,
    default: () => []
  }
})
</script>
