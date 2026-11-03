import type { GlossaryEntry, Placeholder, Review, Origin, SegmentFormat, SegmentKind, SegmentStatus } from '@diglot/core'
import { withLeadingSlash } from 'ufo'
import { CURRENT_DOCS_VERSION, docsPathPrefix, docsStatus, isArchivedDocVersion, isDocVersion, type DocVersion } from './docs'

/**
 * Locales the docs are served in, besides English.
 * `machine` shows unreviewed machine translations; without it only edited and verified segments are shown.
 */
export const L10N_LOCALES = {
  fr: { machine: true }
} as const satisfies Record<string, { machine: boolean }>

export type L10nLocale = keyof typeof L10N_LOCALES

export const L10N_LOCALE_CODES = Object.keys(L10N_LOCALES) as L10nLocale[]

export function isL10nLocale(value: unknown): value is L10nLocale {
  return typeof value === 'string' && Object.hasOwn(L10N_LOCALES, value)
}

/** Share of a page's words that must be `edited` or `verified` for its translation to be indexed. */
const L10N_INDEX_THRESHOLD = 0.8

/** Where a locale is mounted: `/fr`. */
export function localeBasePath(locale: L10nLocale): string {
  return `/${locale}`
}

/** Docs versions with translations: every published version except the archived ones. */
export function isLocalisedDocVersion(version: DocVersion): boolean {
  return !isArchivedDocVersion(version)
}

const LOCALISED_DOCS_RE = /^\/docs\/([^/]+)\/./

/** The docs version of a page path, `undefined` for a version root, a file (`.md`, `.txt`) or anything else. */
function docsPageVersion(path: string): string | undefined {
  const pathname = path.replace(/[?#].*$/, '')
  if (pathname.split('/').pop()!.includes('.')) return

  return LOCALISED_DOCS_RE.exec(pathname)?.[1]
}

/** Whether a page has a localised twin: a page of a translated docs version, `/docs/4.x/guide`. */
export function isLocalisedPage(path: string): boolean {
  const version = docsPageVersion(path)
  return !!version && isDocVersion(version) && isLocalisedDocVersion(version) && !path.startsWith('/docs/examples')
}

const LOCALE_PATH_RE = /^\/([a-z]{2}(?:-[a-z]{2,4})?)(?=[/?#]|$)/i

/**
 * Split a URL into its locale and the English page it mirrors.
 * `/fr/docs/4.x/guide?x=1` → `fr`, path `/docs/4.x/guide?x=1`. `null` for an English URL.
 * A two-letter prefix that is not a served locale comes back as `locale: undefined`.
 */
export function parseLocalePath(url: string): { locale: L10nLocale | undefined, path: string } | null {
  const match = LOCALE_PATH_RE.exec(url)
  if (!match) return null

  const code = match[1]!.toLowerCase()
  // A path starting with `//` or `/\` is protocol-relative, so `/fr//evil.com` would leave the site.
  const rest = url.slice(match[0].length).replace(/^[/\\]+/, '')

  return { locale: isL10nLocale(code) ? code : undefined, path: withLeadingSlash(rest) }
}

/** The localised URL of an English page: `/docs/4.x/guide` → `/fr/docs/4.x/guide`. */
export function localisePath(locale: L10nLocale, path: string): string {
  return `${localeBasePath(locale)}${path}`
}

/** `/docs/guide` → `/docs/4.x/guide`; `undefined` for a versioned or examples path. */
function versionedDocsPath(pathname: string): string | undefined {
  const segment = pathname.split('/')[2]
  if (!pathname.startsWith('/docs/') || !segment || isDocVersion(segment) || segment === 'examples') return

  return pathname.replace('/docs', docsPathPrefix(CURRENT_DOCS_VERSION))
}

/**
 * Where a URL under a locale prefix lands when it is not a localised page.
 * - `/fr` and `/fr/docs` → the French docs index of the current version
 * - `/fr/docs/4.x` and other English redirects → their target, kept French when it is a localised page
 * - `/fr/docs/guide` → `/fr/docs/4.x/guide`
 * - anything else (`/fr/modules`, `/fr/raw/…`, `/fr/llms.txt`) and unknown locales (`/de/docs/…`) → the English URL
 *
 * `undefined` when `url` is a localised page, or has no locale prefix.
 * `redirectFor` resolves the site's own redirect rules for an English path.
 */
export function localeRedirect(url: string, redirectFor: (pathname: string) => string | undefined = () => undefined): string | undefined {
  const parsed = parseLocalePath(url)
  if (!parsed) return

  const { locale, path } = parsed
  if (!locale) return /^\/docs(?:[/?#]|$)/.test(path) ? path : undefined

  const search = /[?#].*$/.exec(path)?.[0] ?? ''
  let pathname = path.slice(0, path.length - search.length).replace(/(.)\/+$/, '$1')
  if (pathname === '/') pathname = '/docs'

  const start = pathname
  for (let hop = 0; hop < 4; hop++) {
    const next = redirectFor(pathname) ?? versionedDocsPath(pathname)
    if (!next || next === pathname) break
    pathname = next
  }

  if (isLocalisedPage(pathname)) {
    return pathname === start && `${pathname}${search}` === path ? undefined : localisePath(locale, `${pathname}${search}`)
  }
  return `${pathname}${search}`
}

/** Whether a localised docs page may be indexed: the version is crawlable. */
export function isIndexableDocsPath(path: string): boolean {
  const version = docsPageVersion(path)
  return !!version && isDocVersion(version) && docsStatus(version) === 'live'
}

/** Words of one page, by what the reader sees for each segment. */
export interface L10nCoverage {
  words: number
  byStatus: Partial<Record<SegmentStatus, number>>
}

/** Share of a page's words that a person edited or verified, 0 to 1. */
export function reviewedShare(coverage: L10nCoverage): number {
  if (!coverage.words) return 0
  return ((coverage.byStatus.edited ?? 0) + (coverage.byStatus.verified ?? 0)) / coverage.words
}

/** Whether a page's translation is reviewed enough to be indexed. */
export function isIndexableCoverage(coverage: L10nCoverage): boolean {
  return reviewedShare(coverage) >= L10N_INDEX_THRESHOLD
}

/** Provenance of a localised page, sent with it. */
export interface L10nPageMeta {
  locale: L10nLocale
  /** The translations commit the page was rendered from. */
  sha: string
  coverage: L10nCoverage
}

/** Paths of the localised pages that may be indexed, by locale. */
export type L10nIndexable = Partial<Record<L10nLocale, string[]>>

/** Locales with at least one indexable page: the only ones English readers are pointed at. */
export function indexedLocales(indexable: L10nIndexable): L10nLocale[] {
  return L10N_LOCALE_CODES.filter(locale => indexable[locale]?.length)
}

/** Where a locale's page is served from: `/api/l10n/fr/get/docs/4.x/guide`. */
export function l10nContentBasePath(locale: L10nLocale): string {
  return `/api/l10n/${locale}`
}

/** A version's navigation tree in a locale: `/api/l10n/fr/navigation/4.x`. */
export function l10nNavigationPath(locale: L10nLocale, version: DocVersion): string {
  return `/api/l10n/${locale}/navigation/${version}`
}

/** The English source of one segment of a page, fetched when a reader inspects it: `/api/l10n/fr/source/<hash>/docs/4.x/guide`. */
export function l10nSourcePath(locale: L10nLocale, hash: string, path: string): string {
  return `/api/l10n/${locale}/source/${hash}${path}`
}

/** What the provenance popover shows for one segment. */
export interface L10nSegmentSource {
  hash: string
  /** The English source, as markdown. */
  source: string
  status: SegmentStatus
  /** GitHub login of the last editor, or the verifier. */
  by?: string
  model?: string
  updatedAt?: string
}

/** One segment of a page, as the translation editor shows it. */
export interface L10nEditorSegment {
  hash: string
  kind: SegmentKind
  format: SegmentFormat
  /** The English source in placeholder form, what a translation is written against. */
  skeleton: string
  words: number
  placeholders: Placeholder[]
  status: SegmentStatus
  record?: {
    text: string
    origin: Origin
    review: Review
    by?: string
    verifiedBy?: string
    rejectedBy?: string
    model?: string
    updatedAt: string
  }
  /** For a translation carried from an earlier source: that source, and the sentences of `skeleton` that are new. */
  previous?: { source: string, changed: string[] }
  /** Glossary entries whose term occurs in the source. */
  glossary: GlossaryEntry[]
}

/** The review state of one localised page. */
export interface L10nPageStatus extends L10nCoverage {
  path: string
  /** Segments waiting for review since their English source changed. */
  pending: number
  /** Share of words edited or verified, 0 to 1. */
  reviewed: number
  indexable: boolean
}

/** The review state of one locale, for `/translations`. */
export interface L10nLocaleStatus {
  locale: L10nLocale
  sha: string
  /** Whether the translations repository machine translates the locale. */
  machine: boolean
  /** Words of every localised page, each segment counted once. */
  coverage: L10nCoverage
  reviewed: number
  pages: L10nPageStatus[]
  indexable: number
  /** Pages reviewed enough to be indexed whose version is not crawlable. */
  readyToIndex: number
  pending: { segments: number, oldestDays?: number, medianDays?: number }
  /** Who edited, verified or rejected something recently, with how many records. */
  activeReviewers: Array<{ login: string, count: number }>
  /** Share of reviewed machine translations verified unchanged, 0 to 1. */
  approvalRate?: number
  /** Median share of a machine translation changed by reviewers who edited it, 0 to 1. */
  editRatio?: number
  /** What the governance rule recommends for the machine translation switch. */
  recommendation?: { machine: boolean, reason: string }
}

/** A locale's review state without its pages. */
export type L10nLocaleSummary = Omit<L10nLocaleStatus, 'pages'> & { pageCount: number }

/** The review state of every locale. */
export const L10N_STATUS_PATH = '/api/l10n/status'

/** The review state of each page of a locale: `/api/l10n/fr/pages`. */
export function l10nPagesStatusPath(locale: L10nLocale): string {
  return `/api/l10n/${locale}/pages`
}

/** A change proposed in a suggestion pull request: a new translation, or removing the current one. */
export interface L10nSuggestion {
  login: string
  number: number
  url: string
  /** The proposed translation; missing when the suggestion rejects the current one. */
  text?: string
}

/** What the translation editor of one page loads. */
export interface L10nEditorPage {
  /** The translations commit the segments were read at. */
  sha: string
  /** What the signed-in user's saves become; `null` when signed out. */
  role: L10nRole | null
  segments: L10nEditorSegment[]
  /** Open suggestions for the segments of the page, by hash; for the locale's team only. */
  suggestions?: Record<string, L10nSuggestion[]>
}

/** The editor's view of a page: `/api/l10n/fr/editor/docs/4.x/guide`. */
export function l10nEditorPath(locale: L10nLocale, path: string): string {
  return `/api/l10n/${locale}/editor${path}`
}

/** What a translator does to one segment: write a new translation, confirm the current one, or remove it. */
export type L10nChangeAction = 'edit' | 'verify' | 'reject'

/** One change in a page save. `text` is the translated skeleton, for `edit` only. */
export interface L10nChange {
  hash: string
  action: L10nChangeAction
  text?: string
}

/** The GitHub account changes are made by. */
export interface L10nTranslator {
  login: string
  id: number | string
}

/** What a signed-in user's saves become: commits for the locale's team, pull requests for everyone else. */
export type L10nRole = 'translator' | 'suggester'

/** Why one change of a save was refused. */
export interface L10nChangeIssue {
  hash: string
  code: 'unknown-segment' | 'duplicate' | 'not-allowed' | 'missing-text' | 'too-long' | 'invalid' | 'unchanged' | 'no-record'
  message: string
  /** The validation errors of an `invalid` edit. */
  errors?: Array<{ code: string, message: string, at?: number }>
}

/** The response to a page save. */
export interface L10nSaveResult {
  mode: 'commit' | 'suggestion'
  /** The commit made on the translations repository. */
  sha: string
  /** What each changed segment shows once the commit is served; a suggestion changes nothing until merged. */
  segments: Record<string, { status: SegmentStatus, text?: string }>
  pull?: { number: number, url: string }
  /** The commits a dry run would have made, where the GitHub App is not configured. */
  dryRun?: Array<{ message: string, author: { name: string, email: string }, files: Array<{ path: string, content: string }> }>
}

/** Where a locale's translations are saved: `/api/l10n/fr/translations`. */
export function l10nTranslationsPath(locale: L10nLocale): string {
  return `/api/l10n/${locale}/translations`
}

/** Localised pages that may be indexed, for `hreflang` and the sitemap. */
export const L10N_INDEXABLE_PATH = '/api/l10n/indexable'

/** The links and robots directive identifying one docs page among its translations. */
export interface L10nHead {
  /** Absolute URL of the page as requested: its canonical and `og:url`. */
  url: string
  alternates: Array<{ hreflang: string, href: string }>
  robots?: string
}

/**
 * Canonical URL, `hreflang` alternates and robots directive of the docs page `path` (English, no prefix)
 * rendered in `locale` (`undefined` for English). An English page without an indexable translation lists no
 * alternates; a localised page always lists its English twin, and is `noindex` until it is indexable itself.
 */
export function l10nHead({ siteUrl, path, locale, indexable }: { siteUrl: string, path: string, locale?: L10nLocale, indexable: L10nIndexable }): L10nHead {
  const origin = siteUrl.replace(/\/+$/, '')
  const english = `${origin}${path}`
  const translations = L10N_LOCALE_CODES.filter(code => indexable[code]?.includes(path))
  const url = locale ? `${origin}${localisePath(locale, path)}` : english

  const alternates = locale || translations.length
    ? [
        { hreflang: 'en', href: english },
        ...translations.map(code => ({ hreflang: code, href: `${origin}${localisePath(code, path)}` })),
        { hreflang: 'x-default', href: english }
      ]
    : []

  return {
    url,
    alternates,
    ...(locale && !translations.includes(locale) ? { robots: 'noindex, follow' } : {})
  }
}

/** The strings of the translation chrome, by locale. */
export const L10N_STRINGS = {
  fr: {
    language: 'Français',
    machine: 'Traduction automatique',
    reviewedTranslation: 'Traduction relue',
    reviewed: (share: number) => `${Math.floor(share * 100)}\u202F% relue`,
    pending: 'Des passages attendent une relecture.',
    toReview: 'à relire',
    review: 'Relire',
    reviewHint: 'Afficher l\'état de chaque passage et le modifier',
    improve: 'Améliorer cette traduction',
    source: 'Texte anglais',
    loading: 'Chargement…',
    status: {
      'untranslated': 'Pas encore traduit : texte anglais',
      'machine': 'Traduction automatique',
      'pending-review': 'Traduction à relire : le texte anglais a changé',
      'edited': 'Traduction relue et modifiée',
      'verified': 'Traduction vérifiée',
      'rejected': 'Traduction rejetée : texte anglais'
    } satisfies Record<SegmentStatus, string>,
    suggestion: 'Cette page est disponible en français.',
    suggestionLink: 'Lire en français',
    editor: {
      title: 'Traduction',
      signIn: 'Se connecter avec GitHub pour modifier',
      suggesterNote: 'Vous ne faites pas partie de l\'équipe de traduction : vos modifications seront proposées dans une pull request.',
      english: 'Texte anglais',
      previousSource: 'Ancien texte anglais',
      changedSentences: 'Les phrases surlignées sont nouvelles dans le texte anglais.',
      current: 'Traduction actuelle',
      none: 'Pas encore traduit.',
      yours: 'Votre traduction',
      placeholders: 'Les marqueurs {0}, {1}… représentent le code et les liens du texte anglais : gardez-les tous, et le texte d\'un lien entre {0} et {/0}.',
      glossary: 'Glossaire',
      glossaryKeep: 'à garder en anglais',
      glossaryTranslate: (target?: string) => target ? `à traduire par « ${target} »` : 'à traduire',
      glossaryKeepGloss: (gloss: string) => `à garder en anglais, avec « ${gloss} »`,
      by: (login: string) => `par @${login}`,
      rejectedBy: (login: string) => `Rejetée par @${login} : la page affiche le texte anglais. Modifiez-la pour la rétablir.`,
      edit: 'Modifier',
      verify: 'Valider',
      reject: 'Rejeter',
      undo: 'Annuler',
      rejectHint: 'La page affichera le texte anglais pour ce passage.',
      staged: { edit: 'Modification en attente', verify: 'Validation en attente', reject: 'Rejet en attente' },
      publish: (count: number) => count ? `Publier ${count} changement${count > 1 ? 's' : ''}` : 'Publier',
      propose: (count: number) => count ? `Proposer ${count} changement${count > 1 ? 's' : ''}` : 'Proposer',
      published: 'Publié : la page sera à jour dans quelques secondes.',
      proposed: 'Proposition envoyée.',
      viewPull: 'Voir la pull request',
      suggestions: 'Suggestions',
      suggestedReject: 'Propose de rejeter la traduction actuelle.',
      suggestionCount: (count: number) => `${count} passage${count > 1 ? 's' : ''} avec des suggestions`,
      dryRun: 'Essai : rien n\'a été publié, l\'application GitHub n\'est pas configurée.',
      failed: 'La publication a échoué.',
      verifyAll: (count: number) => `Valider les ${count} traductions automatiques`,
      verifyAllConfirm: (count: number) => `Valider ${count} traductions automatiques de cette page sans les modifier ? Elles seront publiées comme vérifiées par vous, en une seule fois avec vos autres changements.`,
      confirm: 'Confirmer',
      cancel: 'Annuler',
      previous: 'Passage précédent',
      next: 'Passage suivant',
      position: (index: number, count: number) => `${index} sur ${count}`
    }
  }
} as const satisfies Record<L10nLocale, unknown>

/** Links from an English docs page to its localised twins, labelled in their own language. */
export function localeLinks(path: string): Array<{ locale: L10nLocale, label: string, description: string, to: string }> {
  if (!isLocalisedPage(path)) return []

  return L10N_LOCALE_CODES.map(locale => ({
    locale,
    label: L10N_STRINGS[locale].language,
    description: L10N_STRINGS[locale].machine,
    to: localisePath(locale, path)
  }))
}
