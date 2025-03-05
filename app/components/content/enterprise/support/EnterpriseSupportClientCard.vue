<script setup lang="ts">
defineProps({
  quote: {
    type: String,
    default: ''
  },
  author: {
    type: String,
    default: ''
  },
  job: {
    type: String,
    default: ''
  },
  logo: {
    type: Object as PropType<{ light: string, dark: string, alt: string, width: number, height: number }>,
    default: () => ({})
  },
  achievements: {
    type: Array as PropType<Array<{ title: string, color: string }>>,
    default: () => []
  }
})

type Achievement = {
  title: string
  // Work around a type mismatch where we have no access to BadgeColors from @nuxt/ui
  color: any
}
</script>

<template>
  <UPageCard>
    <template #description>
      {{ quote }}
    </template>

    <div class="flex flex-col justify-end h-full gap-y-4">
      <div class="flex justify-between gap-x-8 pt-6">
        <div>
          <div class="font-semibold text-gray-900 dark:text-white">
            {{ author }}
          </div>
          <div class="text-sm text-gray-600 dark:text-gray-400">
            {{ job }}
          </div>
        </div>

        <UColorModeImage
          :light="logo.light"
          :dark="logo.dark"
          :width="logo.width"
          :height="logo.height"
          :alt="logo.alt"
          class="h-[24px] grayscale"
        />
      </div>

      <ul class="flex gap-x-1 flex-wrap gap-2">
        <li v-for="achievement in achievements" :key="achievement.title">
          <UBadge v-bind="achievement as Achievement" variant="subtle" />
        </li>
      </ul>
    </div>
  </UPageCard>
  <!-- Safelist color for badge -->
  <!-- <UBadge color="pink" /> -->
  <!-- <UBadge color="orange" /> -->
  <!-- <UBadge color="yellow" /> -->
  <!-- <UBadge color="purple" /> -->
</template>
