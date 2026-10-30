<script setup lang="ts">
import type { Template, TemplateHealth } from '#shared/types'

const props = defineProps<{
  template: Template
  health?: TemplateHealth
}>()

const { track } = useAnalytics()

const image = computed(() => templateImage(props.template))
const address = computed(() => (props.template.demo || templateRepoUrl(props.template))?.replace(/^https?:\/\//, '').replace(/\/$/, ''))
</script>

<template>
  <div class="rounded-xl bg-elevated/40 ring ring-default p-1 shadow-xs">
    <div class="h-9 ps-2.5 pe-1 grid grid-cols-[1fr_minmax(0,auto)_1fr] items-center gap-3">
      <div />

      <div class="min-w-0 flex items-center justify-center gap-1.5 text-xs text-muted">
        <UIcon name="i-lucide-lock" class="size-3 shrink-0 text-dimmed" />
        <span class="truncate font-mono">{{ address }}</span>
      </div>

      <div class="flex items-center justify-end gap-0.5">
        <UTooltip v-if="template.demo" text="Open in New Tab">
          <UButton
            :to="template.demo"
            target="_blank"
            icon="i-lucide-arrow-up-right"
            aria-label="Open in new tab"
            color="neutral"
            variant="ghost"
            size="xs"
            @click="track('Template Action', { template: template.name, action: 'Open Demo' })"
          />
        </UTooltip>
      </div>
    </div>

    <div class="relative aspect-video overflow-hidden rounded-lg ring ring-default bg-default">
      <NuxtImg
        v-if="image"
        :src="image"
        :alt="`${template.name} screenshot`"
        class="absolute inset-0 size-full object-cover object-top"
        width="1600"
        height="900"
        format="webp"
      />
      <div
        v-else
        class="absolute inset-0 flex items-center justify-center bg-[radial-gradient(var(--ui-border)_1px,transparent_1px)] bg-[length:16px_16px]"
      >
        <UIcon :name="template.icon || 'i-lucide-app-window'" class="size-10 text-dimmed" />
      </div>
    </div>
  </div>
</template>
