<script setup lang="ts">
import type { SegmentStatus } from '@diglot/core'
import { L10N_STATUS_PATH, L10N_STRINGS, type L10nLocale, type L10nLocaleSummary } from '#shared/utils/l10n'

const { data } = await useFetch<{ locales: L10nLocaleSummary[] }>(L10N_STATUS_PATH, { key: 'l10n-status', default: () => ({ locales: [] }) })

const title = 'Translations'
const description = 'How far each translation of the Nuxt docs is reviewed, and by whom.'
useSeoMeta({ title, description, ogTitle: title, ogDescription: description })

const STATUSES: Array<{ status: SegmentStatus, label: string, color: string }> = [
  { status: 'verified', label: 'Verified', color: 'bg-success' },
  { status: 'edited', label: 'Edited', color: 'bg-info' },
  { status: 'machine', label: 'Machine', color: 'bg-warning' },
  { status: 'pending-review', label: 'Pending review', color: 'bg-warning/50' },
  { status: 'rejected', label: 'Rejected', color: 'bg-error' },
  { status: 'untranslated', label: 'Untranslated', color: 'bg-accented' }
]

const percent = (value?: number) => value === undefined ? 'n/a' : `${Math.round(value * 100)}%`
const share = (locale: L10nLocaleSummary, status: SegmentStatus) => locale.coverage.words ? (locale.coverage.byStatus[status] ?? 0) / locale.coverage.words : 0

const { user } = useUserSession()
const toast = useToast()
const proposing = ref<L10nLocale>()

async function propose(locale: L10nLocale) {
  proposing.value = locale
  try {
    const { pull } = await $fetch<{ pull: { url: string, number: number } }>(`/api/l10n/${locale}/governance`, { method: 'POST' })
    toast.add({ title: `Opened #${pull.number}`, description: pull.url, color: 'success' })
  } catch (error) {
    toast.add({ title: 'Could not open the pull request', description: (error as { statusMessage?: string }).statusMessage, color: 'error' })
  } finally {
    proposing.value = undefined
  }
}
</script>

<template>
  <UPage>
    <UPageHero :title="title" :description="description" />

    <UPageBody class="mt-0">
      <UContainer class="space-y-16">
        <section v-for="locale in data.locales" :key="locale.locale" class="space-y-6">
          <div class="flex flex-wrap items-baseline justify-between gap-2">
            <h2 class="text-2xl font-bold">
              {{ L10N_STRINGS[locale.locale].language }} <span class="text-muted font-mono text-base">{{ locale.locale }}</span>
            </h2>
            <span class="text-xs text-dimmed font-mono">nuxt/translations@{{ locale.sha.slice(0, 7) }}</span>
          </div>

          <UAlert
            v-if="locale.recommendation"
            color="warning"
            variant="subtle"
            icon="i-lucide-scale"
            :description="locale.recommendation.reason"
            :actions="user?.role === 'admin' ? [{ label: 'Open the pull request', loading: proposing === locale.locale, onClick: () => propose(locale.locale) }] : undefined"
          />

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <UPageCard :title="percent(locale.reviewed)" description="of words edited or verified" />
            <UPageCard :title="String(locale.indexable)" :description="`indexable pages of ${locale.pageCount}${locale.readyToIndex ? `, ${locale.readyToIndex} more reviewed enough` : ''}`" />
            <UPageCard :title="String(locale.pending.segments)" :description="locale.pending.segments ? `pending review, oldest ${locale.pending.oldestDays} days, median ${Math.round(locale.pending.medianDays ?? 0)}` : 'pending review'" />
            <UPageCard :title="String(locale.activeReviewers.length)" description="active reviewers in the last 8 weeks" />
            <UPageCard :title="percent(locale.approvalRate)" description="of reviewed machine translations kept as is" />
            <UPageCard :title="percent(locale.editRatio)" description="median share of a machine translation changed when edited" />
            <UPageCard :title="locale.machine ? 'On' : 'Off'" description="machine translation" />
          </div>

          <div class="space-y-2">
            <div class="flex h-3 overflow-hidden rounded-full bg-elevated" role="img" :aria-label="STATUSES.map(({ status, label }) => `${label} ${percent(share(locale, status))}`).join(', ')">
              <div v-for="{ status, color } in STATUSES" :key="status" :class="color" :style="{ width: `${share(locale, status) * 100}%` }" />
            </div>
            <ul class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
              <li v-for="{ status, label, color } in STATUSES" :key="status" class="flex items-center gap-1.5">
                <span class="size-2 rounded-full" :class="color" />{{ label }} {{ percent(share(locale, status)) }}
              </li>
            </ul>
          </div>

          <div v-if="locale.activeReviewers.length" class="flex flex-wrap gap-2">
            <UBadge
              v-for="reviewer in locale.activeReviewers"
              :key="reviewer.login"
              :label="`@${reviewer.login} · ${reviewer.count}`"
              color="neutral"
              variant="subtle"
            />
          </div>

          <TranslationsPages :locale="locale.locale" />
        </section>
      </UContainer>
    </UPageBody>
  </UPage>
</template>
