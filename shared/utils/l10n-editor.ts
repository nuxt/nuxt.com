import type { Review, SegmentKind, SegmentStatus } from '@diglot/core'
import { L10N_TRANSLATIONS_REPO, type L10nChangeIssue, type L10nEditorSegment, type L10nLocale, type L10nRole, type L10nSaveResult } from './l10n'

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
 * comments), grouped by the section of the page they are in, in page order, the page's frontmatter first.
 */
export function otherTextGroups(segments: L10nEditorSegment[]): L10nTextGroup[] {
  const meta: L10nTextGroup = { type: 'meta', segments: [] }
  const sections: L10nTextGroup[] = []
  let section: { group: L10nTextGroup, trail: string } | undefined
  let heading: L10nEditorSegment | undefined
  for (const segment of segments) {
    if (segment.kind === 'heading') {
      heading = segment
      section = undefined
      continue
    }
    if (hasL10nBlock(segment)) continue
    if (segment.kind === 'frontmatter' || segment.kind === 'navigation') {
      meta.segments.push(segment)
      continue
    }
    const trail = segment.context.headingTrail.join('\n')
    if (section?.trail !== trail) {
      const text = segment.context.headingTrail.at(-1)
      const hash = text && heading?.skeleton === text && !heading.placeholders.length ? heading.hash : undefined
      section = { group: { type: 'section', ...(text ? { heading: text } : {}), ...(hash ? { headingHash: hash } : {}), segments: [] }, trail }
      sections.push(section.group)
    }
    section.group.segments.push(segment)
  }
  return [...(meta.segments.length ? [meta] : []), ...sections]
}

/** Whether a page, as fetched by the editor, shows every segment of a save as saved. */
export function isSaveServed(segments: L10nEditorSegment[], saved: L10nSaveResult['segments']): boolean {
  return Object.entries(saved).every(([hash, { status, text }]) => {
    const item = segments.find(segment => segment.hash === hash)
    return !!item && item.status === status && item.record?.text === text
  })
}

/** A commit of the translations repository on GitHub. */
export function l10nCommitUrl(sha: string): string {
  return `https://github.com/${L10N_TRANSLATIONS_REPO}/commit/${sha}`
}

/** The strings of the translation editor, by locale. */
export const L10N_EDITOR_STRINGS = {
  fr: {
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
    noteAdd: 'Expliquer ce changement (facultatif)',
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
} as const satisfies Record<L10nLocale, unknown>
