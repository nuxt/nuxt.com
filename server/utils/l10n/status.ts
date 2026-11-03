import { editRatio, type SegmentStatus } from '@diglot/core'
import type { L10nLocale, L10nLocaleStatus, L10nPageStatus } from '../../../shared/utils/l10n'
import { isIndexableCoverage, reviewedShare } from '../../../shared/utils/l10n'
import type { L10nBundle } from './bundle'
import { manifestStatus, type ManifestSegment } from './coverage'

/** How far back a review counts towards a locale's active reviewers. */
const ACTIVE_REVIEWER_WEEKS = 8

/** Reviewed machine translations needed before the approval rate counts towards the governance rule. */
const APPROVAL_SAMPLE = 50

/** Approval rate below which machine translation should switch off. */
const MIN_APPROVAL_RATE = 0.4

const DAY = 86_400_000

export interface StatusInput {
  locale: L10nLocale
  bundle: L10nBundle
  /** The segments of each localised page, by page path. */
  pages: Map<string, ManifestSegment[]>
  indexable: Set<string>
  /** Whether the translations repository machine translates the locale (`<locale>/locale.yml`). */
  machine: boolean
  now?: Date
}

function median(values: number[]): number | undefined {
  if (!values.length) return
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1]! + sorted[middle]!) / 2
}

/**
 * The review state of one locale: coverage of its localised pages by status, what waits for review,
 * who reviewed recently, how much of the machine translation reviewers kept, and whether the
 * governance rule recommends switching machine translation.
 */
export function localeStatus({ locale, bundle, pages, indexable, machine, now = new Date() }: StatusInput): L10nLocaleStatus {
  const since = now.getTime() - ACTIVE_REVIEWER_WEEKS * 7 * DAY
  const words: Partial<Record<SegmentStatus, number>> = {}
  const seen = new Set<string>()
  const pendingAges: number[] = []
  const pageStatuses: L10nPageStatus[] = []

  for (const [path, segments] of pages) {
    const page: L10nPageStatus = { path, words: 0, byStatus: {}, pending: 0, reviewed: 0, indexable: indexable.has(path) }
    for (const segment of segments) {
      const { hash, words: count } = segment
      if (!count) continue
      const record = bundle.record(hash)
      const status = manifestStatus(record, segment)
      page.words += count
      page.byStatus[status] = (page.byStatus[status] ?? 0) + count
      if (status === 'pending-review') page.pending++
      if (seen.has(hash)) continue
      seen.add(hash)
      words[status] = (words[status] ?? 0) + count
      if (status === 'pending-review' && record) pendingAges.push((now.getTime() - Date.parse(record.updatedAt)) / DAY)
    }
    page.reviewed = reviewedShare(page)
    pageStatuses.push(page)
  }

  const reviewers = new Map<string, number>()
  let reviewedMachine = 0
  let approved = 0
  const edits: number[] = []
  for (const hash of bundle.hashes()) {
    const record = bundle.record(hash)
    if (!record) continue
    const verified = record.verifiedBy && Date.parse(record.verifiedBy.at) >= since ? record.verifiedBy.by : undefined
    const edited = record.review === 'edited' && record.by && Date.parse(record.updatedAt) >= since ? record.by : undefined
    const rejected = record.rejectedBy && Date.parse(record.rejectedBy.at) >= since ? record.rejectedBy.by : undefined
    for (const login of new Set([verified, edited, rejected])) if (login) reviewers.set(login, (reviewers.get(login) ?? 0) + 1)

    if (record.mt && record.review !== 'none') {
      reviewedMachine++
      const ratio = editRatio(record) ?? 0
      if (record.review === 'rejected') continue
      if (ratio === 0) approved++
      else edits.push(ratio)
    }
  }

  const activeReviewers = [...reviewers].map(([login, count]) => ({ login, count })).sort((a, b) => b.count - a.count || a.login.localeCompare(b.login))
  const totalWords = Object.values(words).reduce((sum, count) => sum + (count ?? 0), 0)
  const approvalRate = reviewedMachine ? approved / reviewedMachine : undefined
  const lowApproval = reviewedMachine >= APPROVAL_SAMPLE && approvalRate! < MIN_APPROVAL_RATE
  const off = !activeReviewers.length
    ? `no reviewer in ${ACTIVE_REVIEWER_WEEKS} weeks`
    : lowApproval
      ? `reviewers kept ${Math.round(approvalRate! * 100)}% of ${reviewedMachine} reviewed machine translations unchanged, below ${MIN_APPROVAL_RATE * 100}%`
      : undefined
  const recommendation = machine && off
    ? { machine: false, reason: `Machine translation should switch off for ${locale}: ${off}.` }
    : !machine && !off
        ? { machine: true, reason: `Machine translation could switch on for ${locale}: ${activeReviewers.length} active reviewer${activeReviewers.length > 1 ? 's' : ''}.` }
        : undefined

  return {
    locale,
    sha: bundle.sha,
    machine,
    coverage: { words: totalWords, byStatus: words },
    reviewed: reviewedShare({ words: totalWords, byStatus: words }),
    pages: pageStatuses.sort((a, b) => a.path.localeCompare(b.path)),
    indexable: pageStatuses.filter(page => page.indexable).length,
    readyToIndex: pageStatuses.filter(page => !page.indexable && isIndexableCoverage(page)).length,
    pending: { segments: pendingAges.length, oldestDays: pendingAges.length ? Math.floor(Math.max(...pendingAges)) : undefined, medianDays: median(pendingAges) },
    activeReviewers,
    approvalRate,
    editRatio: median(edits),
    ...(recommendation ? { recommendation } : {})
  }
}
