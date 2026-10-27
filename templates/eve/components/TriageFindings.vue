<script setup lang="ts">
import type { Finding } from '../agent/lib/triage'

defineProps<{
  findings: Finding[]
}>()

const priorityColor = { high: 'error', normal: 'warning', low: 'neutral' } as const
</script>

<template>
  <table class="w-full text-sm my-2">
    <thead class="text-left opacity-60">
      <tr>
        <th class="py-1">
          Issue
        </th>
        <th>Category</th>
        <th>Priority</th>
        <th>Decided by</th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="finding in findings"
        :key="finding.number"
        class="border-t border-neutral-200 dark:border-neutral-800"
      >
        <td class="py-1 pr-2">
          #{{ finding.number }} {{ finding.title }}
          <p
            v-if="finding.summary"
            class="text-xs opacity-60"
          >
            {{ finding.summary }}
          </p>
        </td>
        <td>
          <UBadge
            variant="subtle"
            :label="finding.category"
          />
        </td>
        <td>
          <UBadge
            variant="subtle"
            :color="priorityColor[finding.priority]"
            :label="finding.priority"
          />
        </td>
        <td class="whitespace-nowrap">
          {{ finding.decidedBy === 'reviewer' ? 'Reviewer' : 'Decision model' }}
          <span class="opacity-60">({{ Math.round(finding.confidence * 100) }}%)</span>
        </td>
      </tr>
    </tbody>
  </table>
</template>
