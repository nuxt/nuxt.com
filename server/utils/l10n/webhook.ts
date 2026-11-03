import type { GitHubPushCommit } from '../../types/github'
import { isL10nLocale, L10N_LOCALE_CODES, type L10nLocale } from '../../../shared/utils/l10n'
import { TRANSLATIONS_BRANCH, TRANSLATIONS_REPO, type L10nBundle } from './bundle'

const LOCALE_FILE_RE = /^([^/]+)\/(?:segments\/|locale\.yml$|glossary\.yml$)/
const SHARED_FILE_RE = /^(?:\.diglot\/manifest\/|glossary\.yml$)/

/** Whether a push is to the translations the site serves. */
export function isTranslationsPush(repo: string, branch: string): boolean {
  return repo === TRANSLATIONS_REPO && branch === TRANSLATIONS_BRANCH
}

/**
 * Locales whose snapshot a translations push changed: one of their records, their `locale.yml` or
 * glossary, or a source manifest or the shared glossary, which every locale reads.
 */
export function rebuiltLocales(commits: GitHubPushCommit[]): L10nLocale[] {
  const locales = new Set<L10nLocale>()
  for (const commit of commits) {
    for (const file of [...commit.added ?? [], ...commit.modified ?? [], ...commit.removed ?? []]) {
      if (SHARED_FILE_RE.test(file)) return [...L10N_LOCALE_CODES]
      const locale = LOCALE_FILE_RE.exec(file)?.[1]
      if (isL10nLocale(locale)) locales.add(locale)
    }
  }
  return [...locales]
}

/** Hashes whose record differs between two bundles of one locale: added, removed, retranslated or reviewed. */
export function changedHashes(before: L10nBundle, after: L10nBundle): Set<string> {
  const changed = new Set<string>()
  for (const hash of new Set([...before.hashes(), ...after.hashes()])) {
    const a = before.record(hash)
    const b = after.record(hash)
    if (a?.text !== b?.text || a?.review !== b?.review || a?.origin !== b?.origin || a?.derived !== b?.derived) changed.add(hash)
  }
  return changed
}
