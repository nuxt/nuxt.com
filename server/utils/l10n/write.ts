import { createRecord, normaliseRecord, parseRecord, recordStatus, validate, type Segment, type TranslationRecord, type ValidationIssue } from '@diglot/core'
import { extract } from '@diglot/comark'
import { recordPath, serialiseRecord } from '@diglot/store'
import type { Node } from 'comark'
import type { ContentFile } from 'comark-content'
import type { L10nChange, L10nChangeAction, L10nChangeIssue, L10nLocale, L10nTranslator } from '../../../shared/utils/l10n'
import type { GitAuthor, GitFileChange, GitPullRequest, TranslationsGit } from './git'

/** Longest translation accepted, in characters, whatever its source. */
const MAX_TEXT_LENGTH = 8000

/** Upper bound of a translation's length against its source's: anything longer is not a translation of it. */
const MAX_LENGTH_RATIO = 4

/** Records read from GitHub at once. */
const READ_CONCURRENCY = 8

/** The record files a set of changes writes, or why some of them cannot be applied. */
export interface L10nPlan {
  files: GitFileChange[]
  /** The record each change leaves, `null` for a removed one. */
  records: Map<string, TranslationRecord | null>
  counts: Partial<Record<L10nChangeAction, number>>
  issues: L10nChangeIssue[]
}

export interface PlanInput {
  locale: L10nLocale
  /** The segments of the page the changes were made on, by hash. */
  segments: Map<string, Segment>
  /** The current record of each changed segment, `undefined` for an untranslated one. */
  current: Map<string, TranslationRecord | undefined>
  changes: L10nChange[]
  translator: L10nTranslator
  /** Suggestions edit or reject: verifying belongs to the locale's team. */
  suggestion?: boolean
  now?: Date
}

/** The segments of an English page, by hash: what a save on that page may change. */
export async function pageSegments(file: Pick<ContentFile, 'data' | 'nodes'>): Promise<Map<string, Segment>> {
  const { segments } = await extract({ frontmatter: (file.data ?? {}) as Record<string, unknown>, nodes: (file.nodes ?? []) as Node[] })
  return new Map(segments.map(segment => [segment.hash, segment]))
}

/** The GitHub identity of a translator: their login, at their noreply address. */
export function translatorAuthor(translator: L10nTranslator): GitAuthor {
  return { name: translator.login, email: `${translator.id}+${translator.login}@users.noreply.github.com` }
}

/**
 * The record files `changes` write, built with `@diglot/core` and serialised by `@diglot/store`.
 * - `edit` writes the translator's text as a human edit, keeping the machine candidate it replaces
 * - `verify` keeps the text and marks it verified
 * - `reject` removes the record, so the page shows the English source
 */
export function planChanges({ locale, segments, current, changes, translator, suggestion = false, now = new Date() }: PlanInput): L10nPlan {
  const plan: L10nPlan = { files: [], records: new Map(), counts: {}, issues: [] }
  const at = now.toISOString()
  const issue = (hash: string, code: L10nChangeIssue['code'], message: string, errors?: ValidationIssue[]) => {
    plan.issues.push({ hash, code, message, ...(errors?.length ? { errors } : {}) })
  }

  for (const change of changes) {
    const { hash, action } = change
    const segment = segments.get(hash)
    if (!segment) {
      issue(hash, 'unknown-segment', 'This segment is not on the page.')
      continue
    }
    if (plan.records.has(hash)) {
      issue(hash, 'duplicate', 'This segment is changed twice.')
      continue
    }
    if (suggestion && action === 'verify') {
      issue(hash, 'not-allowed', `Only members of the ${locale} translators team can verify translations.`)
      continue
    }

    const record = current.get(hash)
    let next: TranslationRecord | null

    if (action === 'edit') {
      const text = change.text?.trim() ?? ''
      if (!text) {
        issue(hash, 'missing-text', 'The translation is empty.')
        continue
      }
      if (text.length > Math.min(MAX_TEXT_LENGTH, segment.skeleton.length * MAX_LENGTH_RATIO + 100)) {
        issue(hash, 'too-long', 'The translation is much longer than its source.')
        continue
      }
      const result = validate(text, segment)
      if (!result.ok) {
        issue(hash, 'invalid', result.errors[0]!.message, result.errors)
        continue
      }
      if (record?.text === text) {
        issue(hash, 'unchanged', 'The translation is unchanged: verify it instead.')
        continue
      }
      next = createRecord({
        segment,
        text,
        origin: 'human',
        review: 'edited',
        derived: record?.derived ?? 'fresh',
        prev: record?.prev,
        mt: record?.mt,
        by: translator.login,
        updatedAt: at
      })
    } else if (action === 'verify') {
      if (!record) {
        issue(hash, 'no-record', 'There is no translation to verify.')
        continue
      }
      if (recordStatus(record, segment) === 'rejected') {
        issue(hash, 'invalid', 'The translation no longer fits its source: edit it instead.')
        continue
      }
      if (record.review === 'verified') {
        issue(hash, 'unchanged', 'The translation is already verified.')
        continue
      }
      next = normaliseRecord({ ...record, review: 'verified', verifiedBy: { by: translator.login, at }, updatedAt: at })
    } else {
      if (!record) {
        issue(hash, 'no-record', 'There is no translation to reject.')
        continue
      }
      next = null
    }

    plan.records.set(hash, next)
    plan.counts[action] = (plan.counts[action] ?? 0) + 1
    plan.files.push({ path: recordPath(locale, hash), content: next && serialiseRecord(parseRecord(next)) })
  }

  return plan
}

/** The records of `hashes` at `commit`; a missing or malformed one reads as `undefined`. */
export async function readRecordsAt(git: Pick<TranslationsGit, 'read'>, commit: string, locale: L10nLocale, hashes: string[]): Promise<Map<string, TranslationRecord | undefined>> {
  const records = new Map<string, TranslationRecord | undefined>()
  for (let index = 0; index < hashes.length; index += READ_CONCURRENCY) {
    await Promise.all(hashes.slice(index, index + READ_CONCURRENCY).map(async (hash) => {
      const text = await git.read(commit, recordPath(locale, hash))
      let record: TranslationRecord | undefined
      try {
        record = text === undefined ? undefined : parseRecord(JSON.parse(text))
      } catch {
        record = undefined
      }
      records.set(hash, record?.hash === hash ? record : undefined)
    }))
  }
  return records
}

/** Thrown when changes cannot be applied: an invalid translation, or a segment not on the page. */
export class L10nChangeError extends Error {
  constructor(readonly issues: L10nChangeIssue[]) {
    super(issues.map(issue => `${issue.hash}: ${issue.message}`).join('\n'))
  }
}

/** Thrown when the branch kept moving under a save. */
export class L10nConflictError extends Error {}

export interface SaveInput extends Omit<PlanInput, 'current' | 'suggestion' | 'now'> {
  /** The English page the changes were made on, unprefixed. */
  page: string
}

export interface SaveResult {
  sha: string
  branch: string
  counts: L10nPlan['counts']
  records: L10nPlan['records']
  pull?: GitPullRequest
}

function commitMessage(locale: L10nLocale, page: string, counts: L10nPlan['counts'], translator: L10nTranslator, suggestion: boolean): string {
  const summary = (['edit', 'verify', 'reject'] as const)
    .filter(action => counts[action])
    .map(action => `${action} ${counts[action]}`)
    .join(', ')
  return `chore(${locale}): ${summary} on ${page}\n\n${suggestion ? 'Suggested' : 'Reviewed'} on nuxt.com by @${translator.login}.`
}

/**
 * Read the current records, plan, commit on top of `parent()` and move `branch` there.
 * Retried once when the branch moved in between.
 */
async function commitPlan(git: TranslationsGit, input: SaveInput, branch: string, parent: () => Promise<{ sha: string, force: boolean }>, suggestion: boolean): Promise<SaveResult> {
  const hashes = [...new Set(input.changes.map(change => change.hash))]

  for (let attempt = 0; ; attempt++) {
    const base = await parent()
    const plan = planChanges({ ...input, current: await readRecordsAt(git, base.sha, input.locale, hashes), suggestion })
    if (plan.issues.length) throw new L10nChangeError(plan.issues)

    const sha = await git.commit({
      parent: base.sha,
      files: plan.files,
      message: commitMessage(input.locale, input.page, plan.counts, input.translator, suggestion),
      author: translatorAuthor(input.translator)
    })
    if (await git.update(branch, sha, { force: base.force })) {
      return { sha, branch, counts: plan.counts, records: plan.records }
    }
    if (attempt >= 1) throw new L10nConflictError(`${branch} moved while saving, twice`)
  }
}

/** Commit a team member's changes to one page as one commit on `main`. */
export function commitChanges(git: TranslationsGit, input: SaveInput, branch = 'main'): Promise<SaveResult> {
  return commitPlan(git, input, branch, async () => {
    const sha = await git.head(branch)
    if (!sha) throw new Error(`[l10n] ${branch} does not exist`)
    return { sha, force: false }
  }, false)
}

/** The branch holding a user's suggestions for one locale. */
export function suggestionBranch(login: string, locale: L10nLocale): string {
  return `suggest/${login}/${locale}`
}

/**
 * Commit a suggestion to the user's suggestion branch, and open its pull request when it has none.
 * A branch with an open pull request grows by one commit per save; one without is reset onto `main`,
 * since whatever it held was merged or closed.
 */
export async function suggestChanges(git: TranslationsGit, input: SaveInput, base = 'main'): Promise<SaveResult> {
  const branch = suggestionBranch(input.translator.login, input.locale)
  let pull = await git.findPull(branch)

  const result = await commitPlan(git, input, branch, async () => {
    const [head, main] = await Promise.all([git.head(branch), git.head(base)])
    if (!main) throw new Error(`[l10n] ${base} does not exist`)
    return head && pull ? { sha: head, force: false } : { sha: main, force: !!head }
  }, true)

  pull ??= await git.openPull({
    branch,
    title: `chore(${input.locale}): suggestions from @${input.translator.login}`,
    body: [
      `Translations suggested on nuxt.com by @${input.translator.login}, who is not on the \`translators-${input.locale}\` team yet.`,
      '',
      'Each commit is one page save. Merging accepts them: edits as human edits by the author, rejections as removed translations.'
    ].join('\n')
  })

  return { ...result, pull }
}
