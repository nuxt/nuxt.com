import type { GlossaryEntry, Placeholder, Review, Origin, SegmentContext, SegmentFormat, SegmentKind, SegmentStatus } from '@diglot/core'
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

  for (let hop = 0; hop < 4; hop++) {
    const next = redirectFor(pathname) ?? versionedDocsPath(pathname)
    if (!next || next === pathname) break
    pathname = next
  }

  if (isLocalisedPage(pathname)) {
    const target = localisePath(locale, `${pathname}${search}`)
    return target === url ? undefined : target
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

/** The part of `indexable` one docs page reads: which translations of `path` are indexed. */
export function pageIndexable(indexable: L10nIndexable, path: string): L10nIndexable {
  return Object.fromEntries(L10N_LOCALE_CODES.filter(locale => indexable[locale]?.includes(path)).map(locale => [locale, [path]]))
}

/** Where a locale's page is served from: `/api/l10n/fr/get/docs/4.x/guide`. */
export function l10nContentBasePath(locale: L10nLocale): string {
  return `/api/l10n/${locale}`
}

/** A localised page as served to the browser: `/api/l10n/fr/get/docs/4.x/guide`. */
export function l10nPagePath(locale: L10nLocale, path: string): string {
  return `${l10nContentBasePath(locale)}/get${path}`
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
  /** Where the segment is on the page: its enclosing headings and containers, and its prop name, frontmatter path or code language. */
  context: Pick<SegmentContext, 'headingTrail' | 'containers' | 'detail'>
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

/** A translation the translations branch is known to hold for a segment, ahead of the page the editor loaded. */
export interface L10nKnownRecord {
  /** `null` for no translation. */
  text: string | null
  status: SegmentStatus
  /** When it was learnt, in milliseconds since the epoch. */
  at: number
}

const STATUS_REVIEW: Record<SegmentStatus, Review> = {
  'untranslated': 'none',
  'machine': 'none',
  'pending-review': 'none',
  'edited': 'edited',
  'verified': 'verified',
  'rejected': 'rejected'
}

/** `segment` showing the `known` translation in place of the one it was loaded with. */
export function withKnownRecord(segment: L10nEditorSegment, known: L10nKnownRecord | undefined): L10nEditorSegment {
  if (!known) return segment
  const { record, previous, ...rest } = segment
  if (known.text === null) return { ...rest, status: 'untranslated' }
  return {
    ...rest,
    ...(previous && known.status === 'pending-review' ? { previous } : {}),
    status: known.status,
    record: {
      text: known.text,
      origin: known.status === 'machine' || known.status === 'pending-review' ? (record?.origin ?? 'mt') : 'human',
      review: STATUS_REVIEW[known.status],
      updatedAt: new Date(known.at).toISOString()
    }
  }
}

/** Kinds of segment rendered without a block of their own: they cannot be reached by clicking the page. */
const BLOCKLESS_KINDS = new Set<SegmentKind>(['frontmatter', 'navigation', 'prop', 'image-alt', 'code-label', 'code-comment'])

/** Whether a segment is rendered as a block of the page, which carries `data-l10n-hash`. */
export function hasL10nBlock(segment: Pick<L10nEditorSegment, 'kind'>): boolean {
  return !BLOCKLESS_KINDS.has(segment.kind)
}

/** Segments without a block of their own under one heading of the page. */
export interface L10nTextGroup {
  /** `meta` for the page's title, description and other frontmatter; `section` for texts under `heading`, or before the first heading. */
  type: 'meta' | 'section'
  /** The English text of the nearest enclosing heading. */
  heading?: string
  /** The segment of that heading, when the page has one with that text. */
  headingHash?: string
  segments: L10nEditorSegment[]
}

/**
 * The segments of a page without a block of their own (frontmatter, props, image alts, code labels and
 * comments), grouped under their nearest heading in page order, the page's frontmatter first.
 */
export function otherTextGroups(segments: L10nEditorSegment[]): L10nTextGroup[] {
  const headings = new Map<string, string>()
  for (const segment of segments) {
    if (segment.kind === 'heading' && !segment.placeholders.length && !headings.has(segment.skeleton)) headings.set(segment.skeleton, segment.hash)
  }

  const meta: L10nTextGroup = { type: 'meta', segments: [] }
  const sections = new Map<string, L10nTextGroup>()
  for (const segment of segments) {
    if (hasL10nBlock(segment)) continue
    if (segment.kind === 'frontmatter' || segment.kind === 'navigation') {
      meta.segments.push(segment)
      continue
    }
    const heading = segment.context.headingTrail.at(-1)
    const key = heading ?? ''
    let group = sections.get(key)
    if (!group) {
      group = { type: 'section', ...(heading ? { heading } : {}), ...(heading && headings.has(heading) ? { headingHash: headings.get(heading) } : {}), segments: [] }
      sections.set(key, group)
    }
    group.segments.push(segment)
  }
  return [...(meta.segments.length ? [meta] : []), ...sections.values()]
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
  /** The published translation the change was made against, `null` for an untranslated segment. */
  base: string | null
}

/** Longest note a translator can attach to a save, in characters. */
export const L10N_NOTE_MAX_LENGTH = 500

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
  code: 'unknown-segment' | 'duplicate' | 'not-allowed' | 'missing-text' | 'too-long' | 'invalid' | 'unchanged' | 'no-record' | 'stale'
  message: string
  /** The validation errors of an `invalid` edit. */
  errors?: Array<{ code: string, message: string, at?: number }>
  /** For a `stale` change: the translation it would replace now, `null` for none. */
  current?: { text: string | null, status: SegmentStatus }
}

/** The response to a page save. */
export interface L10nSaveResult {
  mode: 'commit' | 'suggestion'
  /** The commit made on the translations repository. */
  sha: string
  /** What each changed segment shows once the commit is served; a suggestion changes nothing until merged. */
  segments: Record<string, { status: SegmentStatus, text?: string }>
  pull?: { number: number, url: string }
  /** The changes that were not saved, and why; the others were. */
  issues?: L10nChangeIssue[]
  /** The commits a dry run would have made, where the GitHub App is not configured. */
  dryRun?: Array<{ message: string, author: { name: string, email: string }, files: Array<{ path: string, content: string }> }>
}

/** The repository translations are saved to. */
export const L10N_TRANSLATIONS_REPO = 'nuxt/translations'

/** A commit of the translations repository on GitHub. */
export function l10nCommitUrl(sha: string): string {
  return `https://github.com/${L10N_TRANSLATIONS_REPO}/commit/${sha}`
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
    reviewBlockHint: 'Entrée pour modifier ce passage.',
    legend: {
      'untranslated': 'Non traduit',
      'machine': 'Automatique',
      'pending-review': 'À relire',
      'edited': 'Modifié',
      'verified': 'Vérifié',
      'rejected': 'Rejeté'
    } satisfies Record<SegmentStatus, string>,
    improve: 'Améliorer cette traduction',
    readMore: { before: 'Pour en savoir plus, consultez ', after: '.' },
    source: 'Texte source (anglais)',
    loading: 'Chargement…',
    status: {
      'untranslated': 'Pas encore traduit : texte anglais',
      'machine': 'Traduction automatique',
      'pending-review': 'Traduction à relire : le texte anglais a changé',
      'edited': 'Traduction relue et modifiée',
      'verified': 'Traduction vérifiée',
      'rejected': 'Traduction rejetée : texte anglais'
    } satisfies Record<SegmentStatus, string>,
    editor: {
      title: 'Traduction',
      close: 'Fermer',
      signIn: 'Se connecter avec GitHub pour modifier',
      suggesterNote: 'Vous ne faites pas partie de l\'équipe de traduction : vos modifications seront proposées dans une pull request.',
      english: 'Texte source (anglais)',
      previousSource: 'Ancien texte source (anglais)',
      translation: 'Traduction',
      changedSentences: 'Les phrases surlignées sont nouvelles dans le texte anglais.',
      current: 'Traduction actuelle',
      none: 'Pas encore traduit.',
      yours: 'Votre traduction',
      fromSource: 'Partir du texte anglais',
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
      pendingChanges: (count: number) => `${count} changement${count > 1 ? 's' : ''} en attente`,
      publish: (count: number) => count ? `Publier ${count} changement${count > 1 ? 's' : ''}` : 'Publier',
      propose: (count: number) => count ? `Proposer ${count} changement${count > 1 ? 's' : ''}` : 'Proposer',
      publishedNow: 'Traduction publiée : la page est à jour.',
      publishSlow: 'La page n\'est pas encore à jour : vos changements sont enregistrés et seront en ligne d\'ici quelques minutes.',
      saving: (count: number) => `Enregistrement de ${count} changement${count > 1 ? 's' : ''}…`,
      stagedHint: 'Pas encore enregistrés : ils restent dans ce navigateur jusqu\'à la publication.',
      state: {
        publishing: { label: 'Enregistré', hint: 'mise en ligne en cours, en général en moins d\'une minute…' },
        online: { label: 'En ligne', hint: 'la page affiche vos changements.' },
        slow: { label: 'Enregistré', hint: 'la mise en ligne prend plus de temps que prévu : la page sera à jour d\'ici quelques minutes.' }
      },
      commit: 'commit',
      proposedIn: (number: number) => `Proposé dans la pull request #${number} : en ligne une fois accepté par l'équipe de traduction.`,
      notSaved: (count: number) => `${count} changement${count > 1 ? 's' : ''} non enregistré${count > 1 ? 's' : ''} :`,
      issues: {
        'unknown-segment': 'Ce passage n\'est plus sur la page.',
        'duplicate': 'Ce passage est modifié deux fois.',
        'not-allowed': 'Seule l\'équipe de traduction peut valider une traduction.',
        'missing-text': 'La traduction est vide.',
        'too-long': 'La traduction est beaucoup plus longue que le texte source.',
        'invalid': 'La traduction ne correspond pas au texte source.',
        'unchanged': 'Ce changement ne modifie rien.',
        'no-record': 'Il n\'y a pas encore de traduction à valider ou à rejeter.',
        'stale': 'La traduction a changé depuis votre modification.'
      } satisfies Record<L10nChangeIssue['code'], string>,
      staleHint: 'Votre version est gardée : rechargez la traduction actuelle, comparez, puis appliquez à nouveau votre changement.',
      reloadCurrent: 'Recharger la traduction actuelle',
      reloaded: 'Traduction actuelle rechargée : votre version est dans le champ.',
      conflict: 'Les traductions ont changé pendant l\'enregistrement : réessayez.',
      tooMany: 'Trop d\'enregistrements : réessayez dans l\'heure.',
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
      position: (index: number, count: number) => `${index} sur ${count}`,
      otherTexts: 'Autres textes de cette page',
      otherTextsCount: (count: number) => `${count} texte${count > 1 ? 's' : ''}`,
      otherTextsHint: 'Ces textes n\'ont pas de bloc à cliquer sur la page : titre et description, titres des liens « En savoir plus », textes alternatifs des images, titres et commentaires des blocs de code.',
      noteLabel: 'Pourquoi ce changement ? (facultatif)',
      noteHelp: (role: L10nRole) => role === 'translator' ? 'Ajouté au message du commit, pour l\'historique.' : 'Ajouté à la pull request, pour les relecteurs.',
      codePolicy: 'Dans les blocs de code, seuls les commentaires se traduisent : le code reste le même dans toutes les langues.',
      pageMeta: 'Titre et description de la page',
      pageStart: 'Début de la page',
      editThis: 'Modifier ce texte',
      untranslatedShort: 'Pas encore traduit',
      where: (kind: SegmentKind, detail?: string, container?: string): string => {
        if (kind === 'frontmatter') return detail === 'title' ? 'Titre de la page' : detail === 'description' ? 'Description de la page' : `Métadonnée ${detail ?? ''}`.trim()
        if (kind === 'navigation') return `Navigation ${detail ?? ''}`.trim()
        if (kind === 'prop') return `Propriété « ${detail ?? '?'} »${container ? ` de ${container}` : ''}`
        if (kind === 'image-alt') return 'Texte alternatif d\'une image'
        if (kind === 'code-label') return 'Titre d\'un bloc de code'
        if (kind === 'code-comment') return detail ? `Commentaire de code (${detail})` : 'Commentaire de code'
        return 'Passage'
      }
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
