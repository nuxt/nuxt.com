import { editRecord, rejectRecord, verifyRecord, type Policy, type ReviewTransition, type Segment, type TranslationRecord, type ValidationIssue } from '@diglot/core'
import { extract } from '@diglot/comark'
import { parseRecordFile, recordPath, serialiseRecord } from '@diglot/store'
import type { Node } from 'comark'
import type { ContentFile } from 'comark-content'
import { L10N_NOTE_MAX_LENGTH, type L10nChange, type L10nChangeAction, type L10nChangeIssue, type L10nLocale, type L10nTranslator } from '../../../shared/utils/l10n'
import type { GitAuthor, GitFileChange, GitPullRequest, TranslationsGit } from './git'

const STALE_MESSAGE = 'The translation changed since this change was made: review it again.'

const sentence = (message: string) => `${message[0]!.toUpperCase()}${message.slice(1)}.`

/** The record files a set of changes writes, or why some of them cannot be applied. */
export interface L10nPlan {
  files: GitFileChange[]
  /** The record each change leaves. */
  records: Map<string, TranslationRecord>
  counts: Partial<Record<L10nChangeAction, number>>
  issues: L10nChangeIssue[]
}

export interface PlanInput {
  locale: L10nLocale
  /** The segments of the page the changes were made on, by hash. */
  segments: Map<string, Segment>
  /** The current record of each changed segment, `undefined` for an untranslated one. */
  current: Map<string, TranslationRecord | undefined>
  /** The published record of each changed segment, when the changes go on another branch. Defaults to `current`. */
  published?: Map<string, TranslationRecord | undefined>
  changes: L10nChange[]
  translator: L10nTranslator
  /** Suggestions edit or reject: verifying belongs to the locale's team. */
  suggestion?: boolean
  now?: Date
}

/** The segments of an English page under `policy`, by hash: what a save on that page may change. */
export async function pageSegments(file: Pick<ContentFile, 'data' | 'nodes'>, policy: Policy): Promise<Map<string, Segment>> {
  const { segments } = await extract({ frontmatter: (file.data ?? {}) as Record<string, unknown>, nodes: (file.nodes ?? []) as Node[] }, { policy })
  return new Map(segments.map(segment => [segment.hash, segment]))
}

/** The GitHub identity of a translator: their login, at their noreply address. */
export function translatorAuthor(translator: L10nTranslator): GitAuthor {
  return { name: translator.login, email: `${translator.id}+${translator.login}@users.noreply.github.com` }
}

/**
 * The record files `changes` write, built with `@diglot/core`'s review transitions and serialised by `@diglot/store`.
 * - `edit` writes the translator's text as a human edit, keeping the machine candidate it replaces
 * - `verify` keeps the text and marks it verified
 * - `reject` keeps the text and marks it rejected, so the page shows the English source and
 *   machine translation leaves the segment alone; an edit clears it
 */
export function planChanges({ locale, segments, current, published = current, changes, translator, suggestion = false, now = new Date() }: PlanInput): L10nPlan {
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
    const sameBranch = published === current
    if (!sameBranch && (published.get(hash)?.text ?? null) !== change.base) {
      issue(hash, 'stale', STALE_MESSAGE)
      continue
    }

    const record = current.get(hash)
    const options = { by: translator.login, at, ...(sameBranch ? { expected: change.base } : {}) }
    let transition: ReviewTransition
    if (action === 'edit') {
      const text = change.text?.trim() ?? ''
      if (!text) {
        issue(hash, 'missing-text', 'The translation is empty.')
        continue
      }
      transition = editRecord(record, { ...options, segment, text })
    } else if (action === 'verify') {
      transition = verifyRecord(record, { ...options, segment })
    } else {
      transition = rejectRecord(record, options)
    }

    if (transition.ok === false) {
      const { code, message, errors } = transition
      if (code === 'stale') issue(hash, 'stale', STALE_MESSAGE)
      else if (errors.some(error => error.code === 'too-long')) issue(hash, 'too-long', 'The translation is much longer than its source.')
      else issue(hash, code === 'rejected' || code === 'mismatch' ? 'invalid' : code, sentence(message), errors)
      continue
    }
    plan.records.set(hash, transition.record)
    plan.counts[action] = (plan.counts[action] ?? 0) + 1
    plan.files.push({ path: recordPath(locale, hash), content: serialiseRecord(transition.record) })
  }

  return plan
}

/** The records of `hashes` at `commit`; a missing or malformed one reads as `undefined`. */
export async function readRecordsAt(git: Pick<TranslationsGit, 'readFiles'>, commit: string, locale: L10nLocale, hashes: string[]): Promise<Map<string, TranslationRecord | undefined>> {
  const files = await git.readFiles(commit, hashes.map(hash => recordPath(locale, hash)))
  const records = new Map<string, TranslationRecord | undefined>()
  for (const hash of hashes) records.set(hash, parseRecordFile(files.get(recordPath(locale, hash)), hash))
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
  /** Why the changes were made, as the translator wrote it: sanitised before it is written anywhere. */
  note?: string
}

// eslint-disable-next-line no-control-regex
const CONTROL_RE = /[\u0000-\u0008\u000B-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2060-\u2069\uFEFF]/g

/**
 * A translator's note as one paragraph of plain text: control, zero-width and bidirectional characters
 * dropped, each line trimmed, blank lines removed, at most `L10N_NOTE_MAX_LENGTH` characters.
 * `undefined` when nothing is left.
 */
export function sanitiseNote(note: string | undefined): string | undefined {
  if (!note) return
  const text = note
    .normalize('NFC')
    .replace(/\r\n?/g, '\n')
    .replace(/\t/g, ' ')
    .replace(CONTROL_RE, '')
    .split('\n')
    .map(line => line.replace(/ {2,}/g, ' ').trim())
    .filter(Boolean)
    .join('\n')
  const capped = [...text].slice(0, L10N_NOTE_MAX_LENGTH).join('').trim()
  return capped || undefined
}

/** A sanitised note quoted in markdown, with mentions, issue references, links and HTML left inert. */
export function quoteNote(note: string): string {
  return note
    .replace(/[\\`*_[\]<>|~]/g, '\\$&')
    .replace(/([@#])(?=[\w-])/g, '$1\u200B')
    .split('\n')
    .map(line => `> ${line}`)
    .join('\n')
}

export interface SaveResult {
  sha: string
  branch: string
  counts: L10nPlan['counts']
  records: L10nPlan['records']
  pull?: GitPullRequest
}

function commitMessage(locale: L10nLocale, page: string, counts: L10nPlan['counts'], translator: L10nTranslator, suggestion: boolean, note?: string): string {
  const summary = (['edit', 'verify', 'reject'] as const)
    .filter(action => counts[action])
    .map(action => `${action} ${counts[action]}`)
    .join(', ')
  return [
    `chore(${locale}): ${summary} on ${page}`,
    ...(note ? [note] : []),
    `${suggestion ? 'Suggested' : 'Reviewed'} on nuxt.com by @${translator.login}.`
  ].join('\n\n')
}

function noteMarkdown(input: SaveInput, note: string, sha: string): string {
  return `**Note from @${input.translator.login}** on \`${input.page}\` (${sha.slice(0, 7)}):\n\n${quoteNote(note)}`
}

/**
 * Read the current records, plan, commit on top of `parent()` and move `branch` there.
 * Retried once when the branch moved in between.
 */
async function commitPlan(git: TranslationsGit, input: SaveInput, branch: string, parent: (attempt: number) => Promise<{ sha: string, force: boolean, published?: string }>, suggestion: boolean): Promise<SaveResult> {
  const hashes = [...new Set(input.changes.map(change => change.hash))]

  for (let attempt = 0; ; attempt++) {
    const base = await parent(attempt)
    const [current, published] = await Promise.all([
      readRecordsAt(git, base.sha, input.locale, hashes),
      base.published && base.published !== base.sha ? readRecordsAt(git, base.published, input.locale, hashes) : undefined
    ])
    const plan = planChanges({ ...input, current, published, suggestion })
    if (plan.issues.length) throw new L10nChangeError(plan.issues)

    const sha = await git.commit({
      parent: base.sha,
      files: plan.files,
      message: commitMessage(input.locale, input.page, plan.counts, input.translator, suggestion, sanitiseNote(input.note)),
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
 * since whatever it held was merged or closed. A branch that moved during the save, under a concurrent
 * save of the same user, is built on rather than reset.
 */
export async function suggestChanges(git: TranslationsGit, input: SaveInput, base = 'main'): Promise<SaveResult> {
  const branch = suggestionBranch(input.translator.login, input.locale)
  let pull = await git.findPull(branch)

  const result = await commitPlan(git, input, branch, async (attempt) => {
    const [head, main] = await Promise.all([git.head(branch), git.head(base)])
    if (!main) throw new Error(`[l10n] ${base} does not exist`)
    return head && (pull || attempt) ? { sha: head, force: false, published: main } : { sha: main, force: !!head }
  }, true)

  const note = sanitiseNote(input.note)
  let noted = false
  pull ??= await git.openPull({
    branch,
    title: `chore(${input.locale}): suggestions from @${input.translator.login}`,
    body: [
      `Translations suggested on nuxt.com by @${input.translator.login}, who is not on the \`translators-${input.locale}\` team yet.`,
      '',
      'Each commit is one page save. Merging accepts them: edits as human edits by the author, rejections as rejected translations.',
      ...(note ? ['', noteMarkdown(input, note, result.sha)] : [])
    ].join('\n')
  }).then((opened) => {
    noted = true
    return opened
  }, async (error) => {
    const opened = await git.findPull(branch)
    if (!opened) throw error
    return opened
  })

  if (note && !noted) {
    await git.comment(pull.number, noteMarkdown(input, note, result.sha)).catch((error) => {
      console.error(`[l10n] could not add the note of ${result.sha} to #${pull!.number}`, error?.message ?? error)
    })
  }

  return { ...result, pull }
}
