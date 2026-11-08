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

/** Russian plural form for a count: `one` for 1, `few` for 2–4, `many` for 0 and 5+. */
function ruPlural(count: number, one: string, few: string, many: string): string {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
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
    fromSource: 'Copier dans votre traduction',
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
  },
  de: {
    title: 'Übersetzung',
    close: 'Schließen',
    signIn: 'Melde dich mit GitHub an, um zu bearbeiten',
    suggesterNote: 'Du gehörst nicht zum Übersetzungsteam: Deine Änderungen werden in einem Pull-Request vorgeschlagen.',
    english: 'Originaltext (Englisch)',
    previousSource: 'Früherer Originaltext (Englisch)',
    translation: 'Übersetzung',
    changedSentences: 'Die hervorgehobenen Sätze sind im englischen Text neu.',
    current: 'Aktuelle Übersetzung',
    none: 'Noch nicht übersetzt.',
    yours: 'Deine Übersetzung',
    fromSource: 'In deine Übersetzung kopieren',
    placeholders: 'Die Platzhalter {0}, {1}… stehen für den Code und die Links des englischen Textes: Behalte alle bei und setze den Text eines Links zwischen {0} und {/0}.',
    glossary: 'Glossar',
    glossaryKeep: 'auf Englisch belassen',
    glossaryTranslate: (target?: string) => target ? `mit „${target}“ übersetzen` : 'übersetzen',
    glossaryKeepGloss: (gloss: string) => `auf Englisch belassen, ergänzt um „${gloss}“`,
    by: (login: string) => `von @${login}`,
    rejectedBy: (login: string) => `Abgelehnt von @${login}: Die Seite zeigt den englischen Text. Bearbeite die Übersetzung, um sie wiederherzustellen.`,
    edit: 'Bearbeiten',
    verify: 'Bestätigen',
    reject: 'Ablehnen',
    undo: 'Rückgängig',
    rejectHint: 'Die Seite zeigt für diesen Abschnitt den englischen Text.',
    staged: { edit: 'Bearbeitung ausstehend', verify: 'Bestätigung ausstehend', reject: 'Ablehnung ausstehend' },
    pendingChanges: (count: number) => `${count} ${count === 1 ? 'Änderung' : 'Änderungen'} ausstehend`,
    publish: (count: number) => count ? `${count} ${count === 1 ? 'Änderung' : 'Änderungen'} veröffentlichen` : 'Veröffentlichen',
    propose: (count: number) => count ? `${count} ${count === 1 ? 'Änderung' : 'Änderungen'} vorschlagen` : 'Vorschlagen',
    publishedNow: 'Übersetzung veröffentlicht: Die Seite ist aktuell.',
    publishSlow: 'Die Seite ist noch nicht aktuell: Deine Änderungen sind gespeichert und in wenigen Minuten online.',
    saving: (count: number) => count === 1 ? '1 Änderung wird gespeichert…' : `${count} Änderungen werden gespeichert…`,
    stagedHint: 'Noch nicht gespeichert: Die Änderungen bleiben bis zur Veröffentlichung in diesem Browser.',
    state: {
      publishing: { label: 'Gespeichert', hint: 'Die Veröffentlichung läuft und dauert meist weniger als eine Minute…' },
      online: { label: 'Online', hint: 'Die Seite zeigt deine Änderungen.' },
      slow: { label: 'Gespeichert', hint: 'Die Veröffentlichung dauert länger als erwartet: Die Seite ist in wenigen Minuten aktuell.' }
    },
    commit: 'Commit',
    proposedIn: (number: number) => `Vorgeschlagen in Pull-Request #${number}: online, sobald das Übersetzungsteam ihn annimmt.`,
    notSaved: (count: number) => `${count} ${count === 1 ? 'Änderung' : 'Änderungen'} nicht gespeichert:`,
    issues: {
      'unknown-segment': 'Dieser Abschnitt ist nicht mehr auf der Seite.',
      'duplicate': 'Dieser Abschnitt wird zweimal geändert.',
      'not-allowed': 'Nur das Übersetzungsteam kann eine Übersetzung bestätigen.',
      'missing-text': 'Die Übersetzung ist leer.',
      'too-long': 'Die Übersetzung ist viel länger als der Originaltext.',
      'invalid': 'Die Übersetzung passt nicht zum Originaltext.',
      'unchanged': 'Diese Änderung bewirkt nichts.',
      'no-record': 'Es gibt noch keine Übersetzung, die bestätigt oder abgelehnt werden kann.',
      'stale': 'Die Übersetzung wurde seit deiner Änderung geändert.'
    } satisfies Record<L10nChangeIssue['code'], string>,
    staleHint: 'Deine Fassung bleibt erhalten: Lade die aktuelle Übersetzung neu, vergleiche beide und übernimm deine Änderung erneut.',
    reloadCurrent: 'Aktuelle Übersetzung neu laden',
    reloaded: 'Aktuelle Übersetzung neu geladen: Deine Fassung steht im Eingabefeld.',
    conflict: 'Die Übersetzungen wurden während des Speicherns geändert: Versuche es erneut.',
    tooMany: 'Zu viele Speichervorgänge: Versuche es in einer Stunde erneut.',
    viewPull: 'Pull-Request ansehen',
    suggestions: 'Vorschläge',
    suggestedReject: 'Schlägt vor, die aktuelle Übersetzung abzulehnen.',
    suggestionCount: (count: number) => `${count} ${count === 1 ? 'Abschnitt' : 'Abschnitte'} mit Vorschlägen`,
    dryRun: 'Testlauf: Nichts wurde veröffentlicht, die GitHub-App ist nicht eingerichtet.',
    failed: 'Die Veröffentlichung ist fehlgeschlagen.',
    verifyAll: (count: number) => count === 1 ? 'Die maschinelle Übersetzung bestätigen' : `Alle ${count} maschinellen Übersetzungen bestätigen`,
    verifyAllConfirm: (count: number) => count === 1
      ? 'Möchtest du die maschinelle Übersetzung dieser Seite unverändert bestätigen? Die Übersetzung wird zusammen mit deinen anderen Änderungen als von dir bestätigt veröffentlicht.'
      : `Möchtest du ${count} maschinelle Übersetzungen dieser Seite unverändert bestätigen? Die Übersetzungen werden zusammen mit deinen anderen Änderungen als von dir bestätigt veröffentlicht.`,
    confirm: 'Bestätigen',
    cancel: 'Abbrechen',
    previous: 'Vorheriger Abschnitt',
    next: 'Nächster Abschnitt',
    position: (index: number, count: number) => `${index} von ${count}`,
    otherTexts: 'Weitere Texte dieser Seite',
    otherTextsCount: (count: number) => `${count} ${count === 1 ? 'Text' : 'Texte'}`,
    otherTextsHint: 'Diese Texte haben auf der Seite keinen anklickbaren Block: Titel und Beschreibung, Titel der „Weitere Informationen“-Links, Alternativtexte von Bildern sowie Titel und Kommentare von Codeblöcken.',
    noteAdd: 'Erläutere diese Änderung (optional)',
    noteLabel: 'Warum diese Änderung? (optional)',
    noteHelp: (role: L10nRole) => role === 'translator' ? 'Wird zur Nachvollziehbarkeit an die Commit-Nachricht angehängt.' : 'Wird dem Pull-Request für die Prüfung hinzugefügt.',
    codePolicy: 'In Codeblöcken werden nur Kommentare übersetzt: Der Code bleibt in allen Sprachen gleich.',
    pageMeta: 'Titel und Beschreibung der Seite',
    pageStart: 'Anfang der Seite',
    editThis: 'Bearbeite diesen Text',
    untranslatedShort: 'Noch nicht übersetzt',
    where: (kind: SegmentKind, detail?: string, container?: string): string => {
      if (kind === 'frontmatter') return detail === 'title' ? 'Titel der Seite' : detail === 'description' ? 'Beschreibung der Seite' : `Metadaten ${detail ?? ''}`.trim()
      if (kind === 'navigation') return `Navigation ${detail ?? ''}`.trim()
      if (kind === 'prop') return `Prop „${detail ?? '?'}“${container ? ` von ${container}` : ''}`
      if (kind === 'image-alt') return 'Alternativtext eines Bildes'
      if (kind === 'code-label') return 'Titel eines Codeblocks'
      if (kind === 'code-comment') return detail ? `Codekommentar (${detail})` : 'Codekommentar'
      return 'Abschnitt'
    }
  },
  ru: {
    title: 'Перевод',
    close: 'Закрыть',
    signIn: 'Войдите через GitHub, чтобы редактировать',
    suggesterNote: 'Вы не входите в команду переводчиков: ваши изменения будут предложены в pull request.',
    english: 'Исходный текст (английский)',
    previousSource: 'Предыдущий исходный текст (английский)',
    translation: 'Перевод',
    changedSentences: 'Выделенные предложения появились в английском тексте.',
    current: 'Текущий перевод',
    none: 'Ещё не переведено.',
    yours: 'Ваш перевод',
    fromSource: 'Скопировать в ваш перевод',
    placeholders: 'Заполнители {0}, {1}… обозначают код и ссылки английского текста: сохраните их все, а текст ссылки поместите между {0} и {/0}.',
    glossary: 'Глоссарий',
    glossaryKeep: 'оставить на английском',
    glossaryTranslate: (target?: string) => target ? `перевести как «${target}»` : 'перевести',
    glossaryKeepGloss: (gloss: string) => `оставить на английском, добавив «${gloss}»`,
    by: (login: string) => `от @${login}`,
    rejectedBy: (login: string) => `Отклонено пользователем @${login}: страница показывает английский текст. Отредактируйте перевод, чтобы восстановить его.`,
    edit: 'Изменить',
    verify: 'Подтвердить',
    reject: 'Отклонить',
    undo: 'Отменить',
    rejectHint: 'Страница покажет английский текст для этого фрагмента.',
    staged: { edit: 'Изменение ожидает публикации', verify: 'Подтверждение ожидает публикации', reject: 'Отклонение ожидает публикации' },
    pendingChanges: (count: number) => `${count} ${ruPlural(count, 'изменение', 'изменения', 'изменений')} в ожидании`,
    publish: (count: number) => count ? `Опубликовать ${count} ${ruPlural(count, 'изменение', 'изменения', 'изменений')}` : 'Опубликовать',
    propose: (count: number) => count ? `Предложить ${count} ${ruPlural(count, 'изменение', 'изменения', 'изменений')}` : 'Предложить',
    publishedNow: 'Перевод опубликован: страница обновлена.',
    publishSlow: 'Страница ещё не обновлена: ваши изменения сохранены и появятся онлайн через несколько минут.',
    saving: (count: number) => `${ruPlural(count, 'Сохраняется', 'Сохраняются', 'Сохраняются')} ${count} ${ruPlural(count, 'изменение', 'изменения', 'изменений')}…`,
    stagedHint: 'Ещё не сохранено: изменения останутся в этом браузере до публикации.',
    state: {
      publishing: { label: 'Сохранено', hint: 'Публикация идёт, обычно это занимает меньше минуты…' },
      online: { label: 'Опубликовано', hint: 'Страница показывает ваши изменения.' },
      slow: { label: 'Сохранено', hint: 'Публикация занимает больше времени, чем ожидалось: страница обновится через несколько минут.' }
    },
    commit: 'коммит',
    proposedIn: (number: number) => `Предложено в pull request #${number}: появится онлайн, когда команда переводчиков его примет.`,
    notSaved: (count: number) => `Не удалось сохранить ${count} ${ruPlural(count, 'изменение', 'изменения', 'изменений')}:`,
    issues: {
      'unknown-segment': 'Этого фрагмента больше нет на странице.',
      'duplicate': 'Этот фрагмент изменяется дважды.',
      'not-allowed': 'Только команда переводчиков может подтверждать перевод.',
      'missing-text': 'Перевод пуст.',
      'too-long': 'Перевод намного длиннее исходного текста.',
      'invalid': 'Перевод не соответствует исходному тексту.',
      'unchanged': 'Это изменение ничего не меняет.',
      'no-record': 'Пока нет перевода, который можно подтвердить или отклонить.',
      'stale': 'Перевод изменился после вашего изменения.'
    } satisfies Record<L10nChangeIssue['code'], string>,
    staleHint: 'Ваша версия сохранена: загрузите текущий перевод заново, сравните и примените изменение ещё раз.',
    reloadCurrent: 'Загрузить текущий перевод заново',
    reloaded: 'Текущий перевод загружен заново: ваша версия находится в поле ввода.',
    conflict: 'Переводы изменились во время сохранения: попробуйте ещё раз.',
    tooMany: 'Слишком много сохранений: попробуйте через час.',
    viewPull: 'Открыть pull request',
    suggestions: 'Предложения',
    suggestedReject: 'Предлагает отклонить текущий перевод.',
    suggestionCount: (count: number) => `${count} ${ruPlural(count, 'фрагмент', 'фрагмента', 'фрагментов')} с предложениями`,
    dryRun: 'Пробный запуск: ничего не опубликовано, GitHub App не настроен.',
    failed: 'Не удалось опубликовать.',
    verifyAll: (count: number) => count === 1 ? 'Подтвердить машинный перевод' : `Подтвердить все машинные переводы (${count})`,
    verifyAllConfirm: (count: number) => count === 1
      ? 'Подтвердить машинный перевод этой страницы без изменений? Перевод будет опубликован как проверенный вами вместе с остальными вашими изменениями.'
      : `Подтвердить ${count} ${ruPlural(count, 'машинный перевод', 'машинных перевода', 'машинных переводов')} этой страницы без изменений? Переводы будут опубликованы как проверенные вами вместе с остальными вашими изменениями.`,
    confirm: 'Подтвердить',
    cancel: 'Отмена',
    previous: 'Предыдущий фрагмент',
    next: 'Следующий фрагмент',
    position: (index: number, count: number) => `${index} из ${count}`,
    otherTexts: 'Другие тексты этой страницы',
    otherTextsCount: (count: number) => `${count} ${ruPlural(count, 'текст', 'текста', 'текстов')}`,
    otherTextsHint: 'У этих текстов нет блока, на который можно нажать: заголовок и описание страницы, заголовки ссылок «Подробнее», альтернативные тексты изображений, а также заголовки и комментарии блоков кода.',
    noteAdd: 'Объясните это изменение (необязательно)',
    noteLabel: 'Почему это изменение? (необязательно)',
    noteHelp: (role: L10nRole) => role === 'translator' ? 'Добавляется к сообщению коммита для истории.' : 'Добавляется в pull request для проверяющих.',
    codePolicy: 'В блоках кода переводятся только комментарии: код одинаков во всех языках.',
    pageMeta: 'Заголовок и описание страницы',
    pageStart: 'Начало страницы',
    editThis: 'Изменить этот текст',
    untranslatedShort: 'Ещё не переведено',
    where: (kind: SegmentKind, detail?: string, container?: string): string => {
      if (kind === 'frontmatter') return detail === 'title' ? 'Заголовок страницы' : detail === 'description' ? 'Описание страницы' : `Метаданные ${detail ?? ''}`.trim()
      if (kind === 'navigation') return `Навигация ${detail ?? ''}`.trim()
      if (kind === 'prop') return `Свойство «${detail ?? '?'}»${container ? ` в ${container}` : ''}`
      if (kind === 'image-alt') return 'Альтернативный текст изображения'
      if (kind === 'code-label') return 'Заголовок блока кода'
      if (kind === 'code-comment') return detail ? `Комментарий в коде (${detail})` : 'Комментарий в коде'
      return 'Фрагмент'
    }
  }
} as const satisfies Record<L10nLocale, unknown>
