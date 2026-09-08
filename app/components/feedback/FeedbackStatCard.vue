<script setup lang="ts">
interface Props {
  icon: string
  iconColor?: string
  value: number | string
  label: string
  description?: string
  descriptionColor?: string
  popoverStats?: {
    percentage?: string
    trend?: string
    lastPeriod?: string
    details?: string
  }
}

withDefaults(defineProps<Props>(), {
  iconColor: 'text-primary',
  descriptionColor: 'text-muted'
})
</script>

<template>
  <UPopover mode="hover" arrow :open-delay="300" :close-delay="200">
    <div class="flex items-center gap-3 px-4 py-3 bg-muted/20 rounded-lg border border-default cursor-pointer hover:bg-muted/30 transition-colors">
      <UIcon :name="icon" :class="`size-6 ${iconColor} shrink-0`" />
      <div>
        <div class="text-xl font-bold">
          {{ value }}
        </div>
        <div class="text-sm text-muted">
          {{ label }}
        </div>
      </div>
    </div>

    <template #content>
      <div class="p-4 min-w-64">
        <div class="flex items-center gap-2 mb-3">
          <UIcon :name="icon" :class="`size-5 ${iconColor}`" />
          <h3 class="font-semibold">
            {{ label }} Details
          </h3>
        </div>

        <div class="space-y-2 text-sm">
          <div v-if="popoverStats?.percentage" class="flex justify-between">
            <span class="text-muted">Percentage:</span>
            <span class="font-medium">{{ popoverStats.percentage }}</span>
          </div>

          <div v-if="popoverStats?.trend" class="flex justify-between">
            <span class="text-muted">Status:</span>
            <span class="font-medium">
              {{ popoverStats.trend }}
            </span>
          </div>

          <div v-if="popoverStats?.lastPeriod" class="flex justify-between">
            <span class="text-muted">Last 7 days:</span>
            <span class="font-medium">{{ popoverStats.lastPeriod }}</span>
          </div>

          <div v-if="popoverStats?.details" class="pt-2 border-t border-default">
            <p class="text-muted text-xs">
              {{ popoverStats.details }}
            </p>
          </div>
        </div>
      </div>
    </template>
  </UPopover>
</template>
