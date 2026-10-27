<script setup lang="ts">
import type { Template, TemplateHealth } from '#shared/types'

const props = defineProps<{
  template: Template
  health?: TemplateHealth
  index: number
}>()

const { track } = useAnalytics()

const dimmed = computed(() => isOutdated(props.health) || props.health?.check?.status === 'failed')
/** Shown with `v-show`: UPageCard reads the title slot's text for its link's aria-label, and an empty `v-if` adds "v-if" to it. */
const badge = computed(() => props.template.official
  ? { label: 'Official', color: 'primary' as const }
  : props.template.purchase ? { label: 'Paid', color: 'neutral' as const } : undefined)
</script>

<template>
  <UPageCard
    :to="`/templates/${template.slug}`"
    :description="template.description"
    :ui="{
      container: 'p-0 sm:p-0 gap-y-0',
      header: 'relative mb-0 w-full aspect-video overflow-hidden border-b border-default',
      body: 'w-full p-4 pb-3',
      title: 'flex items-center w-full',
      description: 'line-clamp-2',
      footer: 'mt-auto px-4 pb-4 w-full'
    }"
    class="group overflow-hidden"
    @click="track('Template Action', { template: template.name, action: 'Open From Gallery' })"
  >
    <template #header>
      <NuxtImg
        :src="templateImage(template)"
        class="object-cover object-top size-full transition-transform duration-300 motion-safe:group-hover:scale-[1.02]"
        :class="dimmed && 'grayscale-50'"
        :alt="template.name"
        width="640"
        height="360"
        sizes="674px sm:524px lg:426px xl:600px"
        format="webp"
        :modifiers="{ position: 'top' }"
        :loading="index > 3 ? 'lazy' : undefined"
      />
    </template>

    <template #title>
      <div class="w-full grid grid-cols-[1fr_auto] items-center gap-2">
        <p class="truncate m-0">
          {{ template.name }}
        </p>
        <UBadge
          v-show="badge"
          :label="badge?.label"
          :color="badge?.color"
          variant="subtle"
          size="sm"
          class="rounded-full"
          :class="badge?.color === 'neutral' && 'ring-default'"
        />
      </div>
    </template>

    <template v-if="health?.check || isOutdated(health)" #footer>
      <TemplatesCheck :health="health" class="text-xs" />
    </template>
  </UPageCard>
</template>
