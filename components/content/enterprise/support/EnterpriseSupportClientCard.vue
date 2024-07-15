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
    type: String,
    default: ''
  },
  achievements: {
    type: Array as PropType<Array<{ title: string, color: string }>>,
    default: () => []
  }
})
</script>

<template>
  <UPageCard :ui="{ background: 'card-bg' }">
    <template #description>
      {{ quote }}
    </template>

    <div class="flex justify-between gap-x-2 pt-6">
      <div>
        <div class="font-semibold text-gray-900 dark:text-white">
          {{ author }}
        </div>
        <div class="text-sm text-gray-600 dark:text-gray-400">
          {{ job }}
        </div>
      </div>
      <img :src="logo" width="140" height="20">
    </div>

    <template #footer>
      <ul class="flex gap-x-1">
        <li v-for="achievement in achievements" :key="achievement.title">
          <UBadge v-bind="achievement" variant="subtle" />
        </li>
      </ul>
    </template>
  </UPageCard>
</template>

<style lang="postcss">
.dark .card-bg {
  background: linear-gradient(0deg, rgba(15, 23, 42, 0.20) 0%, rgba(15, 23, 42, 0.20) 100%), linear-gradient(180deg, rgba(51, 65, 85, 0.50) 0%, rgba(2, 4, 32, 0.50) 33.92%);
}
</style>
