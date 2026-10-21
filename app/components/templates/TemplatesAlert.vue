<script setup lang="ts">
import type { Template, TemplateHealth } from '#shared/types'

const props = defineProps<{
  template: Template
  health?: TemplateHealth
  /** Whether another template of the same category builds today, so the link never lands on an empty list. */
  hasWorkingAlternative?: boolean
}>()

const STEPS = ['install', 'build', 'start'] as const

const failed = computed(() => props.health?.check?.status === 'failed' ? props.health.check : undefined)
const outdated = computed(() => !failed.value && isOutdated(props.health))
const failedAt = computed(() => STEPS.findIndex(step => step === failed.value?.step))
const verb = computed(() => failed.value?.step === 'start' ? 'start' : 'build')
const issuesUrl = computed(() => props.template.repo && `https://github.com/${props.template.repo}/issues`)
const category = computed(() => props.hasWorkingAlternative ? TEMPLATE_CATEGORIES.find(item => item.value === props.template.category) : undefined)
const alternatives = computed(() => ({ path: '/templates', query: { status: 'working', category: category.value?.value } }))
</script>

<template>
  <div
    v-if="failed || outdated"
    role="status"
    class="rounded-lg ring ring-default bg-elevated/30 p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8"
  >
    <div class="min-w-0 flex-1 flex flex-col gap-1">
      <p class="flex items-center gap-2 text-sm font-medium text-highlighted">
        <span class="size-1.5 shrink-0 rounded-full" :class="failed ? 'bg-error' : 'bg-warning'" />
        {{ failed ? (failed.passedAt ? `It no longer ${verb}s` : `It doesn't ${verb} right now`) : `Still on Nuxt ${health?.nuxtMajor}` }}
      </p>
      <p class="text-sm text-muted text-pretty">
        <template v-if="failed?.passedAt">
          It passed the daily check <NuxtTime :datetime="failed.passedAt" relative />, and now stops at the {{ failed.step }} step.
          <template v-if="canLivePreview(template)">
            The live preview is off until it passes again.
          </template>
        </template>
        <template v-else-if="failed">
          The daily check stopped at the {{ failed.step }} step, so expect to fix it before building on it.
        </template>
        <template v-else>
          It hasn't moved to Nuxt {{ CURRENT_NUXT_MAJOR }} yet, so expect an upgrade before building on it.
        </template>
      </p>
    </div>

    <ol v-if="failed && failedAt >= 0" class="w-full sm:w-48 shrink-0 grid grid-cols-3 gap-1" aria-label="Daily check">
      <li v-for="(step, index) in STEPS" :key="step" class="flex flex-col gap-1.5">
        <span class="h-1 rounded-full" :class="index < failedAt ? 'bg-accented' : index === failedAt ? 'bg-error' : 'bg-elevated'" />
        <span class="text-xs capitalize" :class="index < failedAt ? 'text-muted' : index === failedAt ? 'text-highlighted' : 'text-dimmed'">
          {{ step }}
          <span class="sr-only">{{ index < failedAt ? 'passed' : index === failedAt ? 'failed' : 'skipped' }}</span>
        </span>
      </li>
    </ol>

    <div class="flex items-center gap-1 shrink-0 -ms-2.5 sm:ms-0">
      <template v-if="failed">
        <UButton
          v-if="issuesUrl"
          :to="issuesUrl"
          target="_blank"
          label="Issues"
          color="neutral"
          variant="ghost"
          size="sm"
        />
        <UButton
          :to="alternatives"
          :label="category ? `Working ${category.label} Templates` : 'Working Templates'"
          trailing-icon="i-lucide-arrow-right"
          color="neutral"
          variant="subtle"
          size="sm"
        />
      </template>
      <UButton
        v-else
        to="/docs/4.x/getting-started/upgrade"
        label="Upgrade Guide"
        trailing-icon="i-lucide-arrow-right"
        color="neutral"
        variant="subtle"
        size="sm"
      />
    </div>
  </div>
</template>
