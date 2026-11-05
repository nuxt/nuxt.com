<script setup lang="ts">
import { maxTranslationLength, validate } from '@diglot/core'
import type { ButtonProps } from '@nuxt/ui'
import { L10N_NOTE_MAX_LENGTH, L10N_STRINGS, l10nEditorPath, l10nTranslationsPath, localisePath, type L10nChange, type L10nChangeIssue, type L10nEditorPage, type L10nLocale, type L10nSaveResult } from '#shared/utils/l10n'
import { hasL10nBlock, isSaveServed, L10N_EDITOR_STRINGS, l10nCommitUrl, otherTextGroups, withKnownRecord, type L10nKnownRecord } from '#shared/utils/l10n-editor'

const props = defineProps<{
  locale: L10nLocale
  /** The English page, unprefixed. */
  path: string
  /** The rendered document, whose blocks carry `data-l10n-hash`. */
  target?: HTMLElement | null
}>()

const emit = defineEmits<{
  /** The saved changes are now served, at translations commit `sha`: the page can be fetched again. */
  published: [sha: string]
}>()

const open = defineModel<boolean>('open', { default: false })
const hash = defineModel<string | undefined>('hash')

const strings = computed(() => L10N_STRINGS[props.locale])
const t = computed(() => L10N_EDITOR_STRINGS[props.locale])
const toast = useToast()
/** Close buttons labelled in the page's language. */
const closeButton = computed(() => ({ 'aria-label': t.value.close }) as ButtonProps)
const reducedMotion = usePreferredReducedMotion()

/** How long a translation known ahead of the editor's page is shown in its place. */
const KNOWN_TTL = 60 * 60_000

const { data: page, refresh, status: loading } = useFetch<L10nEditorPage>(() => l10nEditorPath(props.locale, props.path), {
  server: false,
  immediate: false,
  watch: false
})

watch(open, (value) => {
  if (value && !page.value) refresh()
}, { immediate: true })

const storageKey = `docs-l10n:${props.locale}:${props.path}`
const changes = useLocalStorage(`${storageKey}:changes`, new Map<string, L10nChange>())
const drafts = useLocalStorage(`${storageKey}:drafts`, new Map<string, string>())
const note = useLocalStorage(`${storageKey}:note`, '')
/** The note field stays a one-line link until asked for, so the footer leaves room for the form. */
const noteOpen = ref(false)
const noteField = useTemplateRef<{ textareaRef?: HTMLTextAreaElement }>('noteField')
function openNote() {
  noteOpen.value = true
  nextTick(() => noteField.value?.textareaRef?.focus())
}
/** Translations saved or reported as current that the editor's page does not show yet. */
const known = useLocalStorage(`${storageKey}:known`, new Map<string, L10nKnownRecord>())

watch(page, (value) => {
  if (!value) return
  const fetched = new Map(value.segments.map(item => [item.hash, item]))
  for (const [key, entry] of [...known.value]) {
    const item = fetched.get(key)
    if (!item || Date.now() - entry.at > KNOWN_TTL || ((item.record?.text ?? null) === entry.text && item.status === entry.status)) known.value.delete(key)
  }
})

const segments = computed(() => (page.value?.segments ?? []).map(item => withKnownRecord(item, known.value.get(item.hash))))

const index = computed(() => segments.value.findIndex(segment => segment.hash === hash.value))
const segment = computed(() => segments.value[index.value])
const role = computed(() => page.value?.role)

function go(offset: number) {
  const next = segments.value[index.value + offset]
  if (next) hash.value = next.hash
}

/** Lists of other texts up to this long start open. */
const OTHER_TEXTS_OPEN_LIMIT = 6

const otherGroups = computed(() => otherTextGroups(segments.value))
const otherCount = computed(() => otherGroups.value.reduce((count, group) => count + group.segments.length, 0))
const otherOpen = ref(false)
watch(otherCount, (count, before) => {
  if (!before) otherOpen.value = count <= OTHER_TEXTS_OPEN_LIMIT
}, { immediate: true })

const formTop = useTemplateRef<HTMLElement>('formTop')
const draftField = useTemplateRef<{ textareaRef?: HTMLTextAreaElement }>('draftField')

function select(key: string) {
  hash.value = key
  nextTick(() => {
    const field = draftField.value?.textareaRef ?? formTop.value
    field?.focus({ preventScroll: true })
    formTop.value?.scrollIntoView({ block: 'start', behavior: reducedMotion.value === 'reduce' ? 'auto' : 'smooth' })
  })
}

function groupLabel(group: ReturnType<typeof otherTextGroups>[number]): { text: string, lang?: string } {
  if (group.type === 'meta') return { text: t.value.pageMeta }
  if (!group.heading) return { text: t.value.pageStart }
  const translated = segments.value.find(item => item.hash === group.headingHash)?.record?.text
  return translated ? { text: translated } : { text: group.heading, lang: 'en' }
}

/** Whether the page has code blocks: the code policy shows for as long as it does, so the form does not move as the page scrolls. */
const pageHasCode = ref(false)
watch([open, () => props.target, () => page.value], ([isOpen, target]) => {
  pageHasCode.value = !!(isOpen && target?.querySelector('pre'))
}, { flush: 'post' })
const CODE_KINDS = new Set(['code-comment', 'code-label'])
const codeInView = computed(() => !!segment.value && (CODE_KINDS.has(segment.value.kind) || pageHasCode.value))

const where = (item: { kind: Parameters<typeof t.value.where>[0], context: { detail?: string, containers: string[] } }) =>
  t.value.where(item.kind, item.context.detail, item.context.containers.at(-1))

watch([segments, hash], ([list, current]) => {
  if (!list.length) return
  if (!list.some(item => item.hash === current)) hash.value = list[0]!.hash
  const published = new Map(list.map(item => [item.hash, item]))
  const stale: L10nChangeIssue[] = []
  for (const [key, change] of [...changes.value]) {
    const item = published.get(key)
    if (!item) {
      changes.value.delete(key)
    } else if (change.base !== (item.record?.text ?? null)) {
      changes.value.delete(key)
      if (change.action === 'edit' && change.text && !drafts.value.has(key)) drafts.value.set(key, change.text)
      stale.push({ hash: key, code: 'stale', message: t.value.issues.stale, current: { text: item.record?.text ?? null, status: item.status } })
    }
  }
  for (const key of [...drafts.value.keys()]) if (!published.has(key)) drafts.value.delete(key)
  if (stale.length) issues.value = [...issues.value.filter(item => !stale.some(other => other.hash === item.hash)), ...stale]
})

const draft = computed({
  get: () => segment.value ? drafts.value.get(segment.value.hash) ?? changes.value.get(segment.value.hash)?.text ?? segment.value.record?.text ?? '' : '',
  set: (value: string) => {
    if (segment.value) drafts.value.set(segment.value.hash, value)
  }
})

const validation = computed(() => segment.value && draft.value.trim() ? validate(draft.value.trim(), segment.value, { maxLength: maxTranslationLength(segment.value.skeleton) }) : undefined)
const changed = computed(() => !!segment.value && draft.value.trim() !== (segment.value.record?.text ?? ''))
const rejected = computed(() => segment.value?.record?.review === 'rejected')
const staged = computed(() => segment.value && changes.value.get(segment.value.hash))
const canEdit = computed(() => (changed.value || rejected.value) && !!validation.value?.ok)

const announcement = ref('')

function stage(action: L10nChange['action']) {
  const current = segment.value
  if (!current) return
  const base = current.record?.text ?? null
  changes.value.set(current.hash, action === 'edit' ? { hash: current.hash, action, text: draft.value.trim(), base } : { hash: current.hash, action, base })
  drafts.value.delete(current.hash)
  issues.value = issues.value.filter(issue => issue.hash !== current.hash)
  announcement.value = t.value.staged[action]
}

function unstage(key = segment.value?.hash) {
  if (!key) return
  changes.value.delete(key)
  drafts.value.delete(key)
  announcement.value = t.value.pendingChanges(changes.value.size)
}

const machine = computed(() => segments.value.filter(item => item.status === 'machine' && !changes.value.has(item.hash)))
const confirmVerifyAll = ref(false)

function verifyAll() {
  for (const item of machine.value) changes.value.set(item.hash, { hash: item.hash, action: 'verify', base: item.record?.text ?? null })
  confirmVerifyAll.value = false
}

function blocks(hash: string): HTMLElement[] {
  return [...props.target?.querySelectorAll<HTMLElement>(`[data-l10n-hash="${hash}"]`) ?? []]
}

const suggestions = computed(() => page.value?.suggestions ?? {})
const suggested = computed(() => segment.value ? suggestions.value[segment.value.hash] ?? [] : [])

watch(suggestions, (value, before = {}) => {
  for (const hash of Object.keys(before)) for (const block of blocks(hash)) block.removeAttribute('data-l10n-suggested')
  for (const hash of Object.keys(value)) for (const block of blocks(hash)) block.setAttribute('data-l10n-suggested', '')
})

watch(() => [...changes.value.values()].map(({ hash, action }) => ({ hash, action })), (list, before = []) => {
  for (const { hash } of before) for (const block of blocks(hash)) block.removeAttribute('data-l10n-staged')
  for (const { hash, action } of list) for (const block of blocks(hash)) block.setAttribute('data-l10n-staged', action)
}, { immediate: true })

let active: HTMLElement[] = []
watch([open, hash, () => props.target], ([isOpen, current]) => {
  for (const block of active) block.removeAttribute('data-l10n-active')
  active = isOpen && current ? blocks(current) : []
  for (const block of active) block.setAttribute('data-l10n-active', '')
  active[0]?.scrollIntoView({ block: 'nearest', behavior: reducedMotion.value === 'reduce' ? 'auto' : 'smooth' })
}, { flush: 'post' })

/** Back on the block being edited, unless focus already moved elsewhere on the page. */
function returnFocus(event: Event) {
  const block = hash.value ? blocks(hash.value)[0] : undefined
  const focused = document.activeElement
  if (!block || (focused && focused !== document.body && !(event.target as Node | null)?.contains(focused))) return
  event.preventDefault()
  block.focus({ preventScroll: true })
}

function excerpt(key: string): string {
  const text = segments.value.find(item => item.hash === key)?.skeleton.replace(/\{\/?\d+\}/g, '') ?? key
  return text.length > 60 ? `${text.slice(0, 59)}…` : text
}

const saving = ref(false)
const result = ref<L10nSaveResult>()
const failure = ref<string>()
const issues = ref<L10nChangeIssue[]>([])
const issue = computed(() => issues.value.find(item => item.hash === segment.value?.hash))
const staleIssue = computed(() => issue.value?.code === 'stale' ? issue.value : undefined)
const fieldIssue = computed(() => issue.value?.code === 'stale' ? undefined : issue.value)
const errorMessage = computed(() => validation.value?.errors[0]?.message ?? (fieldIssue.value ? t.value.issues[fieldIssue.value.code] : undefined))

/** Show the translation a stale change would replace, keeping the change as a draft. */
function reload(key: string) {
  const found = issues.value.find(item => item.hash === key && item.code === 'stale')
  if (found?.current) known.value.set(key, { ...found.current, at: Date.now() })
  const change = changes.value.get(key)
  if (change) {
    if (change.action === 'edit' && change.text) drafts.value.set(key, change.text)
    changes.value.delete(key)
  }
  issues.value = issues.value.filter(item => item.hash !== key)
  announcement.value = t.value.reloaded
}

/** Where the last save is: written to the translations repository, served, or still waiting to be. */
const publication = ref<{ sha: string, state: 'publishing' | 'online' | 'slow' }>()
const commitUrl = computed(() => publication.value ? l10nCommitUrl(publication.value.sha) : undefined)

let disposed = false
onScopeDispose(() => {
  disposed = true
  for (const block of active) block.removeAttribute('data-l10n-active')
})

/** Seconds between two checks of whether a save is served. */
const PUBLICATION_CHECKS = [...Array.from({ length: 20 }, () => 3), ...Array.from({ length: 36 }, () => 15)]

async function waitForPublication(sha: string, saved: L10nSaveResult['segments']) {
  publication.value = { sha, state: 'publishing' }
  const current = () => publication.value?.sha === sha
  for (const [attempt, delay] of PUBLICATION_CHECKS.entries()) {
    await new Promise(resolve => setTimeout(resolve, delay * 1000))
    if (disposed || !current()) return
    await refresh()
    if (!current()) return
    if (isSaveServed(page.value?.segments ?? [], saved)) {
      publication.value = { sha, state: 'online' }
      emit('published', page.value!.sha)
      toast.add({ title: t.value.publishedNow, icon: 'i-lucide-check', color: 'success' })
      return
    }
    if (attempt === 19) {
      publication.value = { sha, state: 'slow' }
      toast.add({ title: t.value.publishSlow, icon: 'i-lucide-clock', color: 'neutral' })
    }
  }
}

function showIssues(list: L10nChangeIssue[]) {
  issues.value = list
  if (list[0] && !list.some(item => item.hash === hash.value)) hash.value = list[0].hash
}

async function save() {
  if (!changes.value.size || saving.value) return
  saving.value = true
  failure.value = undefined
  result.value = undefined
  issues.value = []
  const sent = [...changes.value.values()]
  const sentNote = note.value
  try {
    const response = await $fetch<L10nSaveResult>(l10nTranslationsPath(props.locale), {
      method: 'POST',
      body: { page: props.path, changes: sent, ...(sentNote.trim() ? { note: sentNote.trim() } : {}) }
    })
    result.value = response
    const refused = new Set(response.issues?.map(item => item.hash))
    for (const change of sent) {
      if (!refused.has(change.hash) && JSON.stringify(changes.value.get(change.hash)) === JSON.stringify(change)) changes.value.delete(change.hash)
    }
    if (note.value === sentNote) {
      note.value = ''
      noteOpen.value = false
    }
    showIssues(response.issues ?? [])
    if (response.mode === 'commit' && !response.dryRun) {
      const at = Date.now()
      for (const [key, { status, text }] of Object.entries(response.segments)) {
        known.value.set(key, { text: text ?? null, status, at })
        for (const block of blocks(key)) block.setAttribute('data-l10n', status)
      }
      waitForPublication(response.sha, response.segments)
    }
  } catch (error) {
    const { statusCode, data } = error as { statusCode?: number, data?: { data?: { issues?: L10nChangeIssue[] } } }
    if (statusCode === 422 && data?.data?.issues?.length) showIssues(data.data.issues)
    else failure.value = statusCode === 409 ? t.value.conflict : statusCode === 429 ? t.value.tooMany : t.value.failed
  } finally {
    saving.value = false
  }
}

defineShortcuts(computed(() => open.value && role.value
  ? {
      meta_enter: {
        usingInput: true,
        handler: () => {
          if (canEdit.value) stage('edit')
        }
      }
    }
  : {}))

const signInUrl = computed(() => `/api/auth/github?redirect=${encodeURIComponent(localisePath(props.locale, props.path))}`)

function glossaryHint(entry: NonNullable<typeof segment.value>['glossary'][number]): string {
  if (entry.decision === 'keep') return t.value.glossaryKeep
  if (entry.decision === 'keep-gloss') return t.value.glossaryKeepGloss(entry.gloss)
  return t.value.glossaryTranslate(entry.target)
}
</script>

<template>
  <USlideover
    v-model:open="open"
    :modal="false"
    :overlay="false"
    :close="closeButton"
    :content="{ onInteractOutside: (event: Event) => event.preventDefault(), onCloseAutoFocus: returnFocus }"
    :title="t.title"
    :description="segment ? strings.status[segment.status] : undefined"
    :ui="{ content: 'max-w-lg', body: 'space-y-5 text-sm' }"
  >
    <template #actions>
      <div v-if="segments.length" class="flex items-center gap-1 text-xs text-muted">
        <UButton
          icon="i-lucide-chevron-up"
          color="neutral"
          variant="ghost"
          size="xs"
          :aria-label="t.previous"
          :disabled="index <= 0"
          @click="go(-1)"
        />
        <span v-if="index >= 0" aria-live="polite">{{ t.position(index + 1, segments.length) }}</span>
        <UButton
          icon="i-lucide-chevron-down"
          color="neutral"
          variant="ghost"
          size="xs"
          :aria-label="t.next"
          :disabled="index >= segments.length - 1"
          @click="go(1)"
        />
      </div>
    </template>

    <template #body>
      <p v-if="loading === 'pending' && !page" class="text-muted" role="status">
        {{ strings.loading }}
      </p>

      <template v-else-if="segment">
        <p v-if="!hasL10nBlock(segment)" ref="formTop" tabindex="-1" class="text-xs text-muted outline-none">
          {{ where(segment) }}<template v-if="segment.context.headingTrail.length">
            · <span lang="en">{{ segment.context.headingTrail.at(-1) }}</span>
          </template>
        </p>
        <span v-else ref="formTop" />

        <p v-if="codeInView" class="flex gap-1.5 text-xs text-toned" data-l10n-code-policy>
          <UIcon name="i-lucide-code" class="size-3.5 shrink-0 translate-y-0.5" />
          {{ t.codePolicy }}
        </p>

        <section class="space-y-1">
          <h3 class="text-xs font-medium uppercase text-muted">
            {{ t.english }}
          </h3>
          <p lang="en" class="text-highlighted">
            <DocsL10nSkeleton :skeleton="segment.skeleton" :placeholders="segment.placeholders" />
          </p>
        </section>

        <section v-if="segment.previous" class="space-y-1 rounded-md bg-elevated p-3">
          <p class="text-xs text-toned">
            <UIcon name="i-lucide-triangle-alert" class="size-3.5 align-text-bottom text-(--l10n-warning)" />
            {{ t.changedSentences }}
          </p>
          <p v-for="sentence in segment.previous.changed" :key="sentence" lang="en" class="bg-warning/20 rounded px-1 text-highlighted">
            <DocsL10nSkeleton :skeleton="sentence" :placeholders="segment.placeholders" />
          </p>
          <details class="text-xs text-muted">
            <summary>{{ t.previousSource }}</summary>
            <p lang="en">
              {{ segment.previous.source }}
            </p>
          </details>
        </section>

        <section v-if="segment.glossary.length" class="space-y-1">
          <h3 class="text-xs font-medium uppercase text-muted">
            {{ t.glossary }}
          </h3>
          <ul class="space-y-0.5">
            <li v-for="entry in segment.glossary" :key="entry.term">
              <span lang="en" class="font-medium text-highlighted">{{ entry.term }}</span>
              <span class="text-muted"> : {{ glossaryHint(entry) }}</span>
              <span v-if="entry.note" lang="en" class="text-muted"> ({{ entry.note }})</span>
            </li>
          </ul>
        </section>

        <section class="space-y-1">
          <h3 class="text-xs font-medium uppercase text-muted">
            {{ t.current }}
          </h3>
          <p v-if="segment.record" class="text-highlighted">
            <DocsL10nSkeleton :skeleton="segment.record.text" :placeholders="segment.placeholders" />
          </p>
          <p v-else class="text-muted">
            {{ t.none }}
          </p>
          <p v-if="segment.record?.rejectedBy" class="text-xs text-(--l10n-error)">
            {{ t.rejectedBy(segment.record.rejectedBy) }}
          </p>
          <p v-else-if="segment.record?.verifiedBy || segment.record?.by || segment.record?.model" class="text-xs text-muted">
            {{ segment.record.verifiedBy ? t.by(segment.record.verifiedBy) : segment.record.by ? t.by(segment.record.by) : segment.record.model }}
          </p>
        </section>

        <section v-if="suggested.length" class="space-y-2">
          <h3 class="text-xs font-medium uppercase text-muted">
            {{ t.suggestions }}
          </h3>
          <div v-for="suggestion in suggested" :key="suggestion.number" class="rounded-md border border-default p-2 space-y-1">
            <p v-if="suggestion.text" class="text-highlighted">
              <DocsL10nSkeleton :skeleton="suggestion.text" :placeholders="segment.placeholders" />
            </p>
            <p v-else class="text-(--l10n-error)">
              {{ t.suggestedReject }}
            </p>
            <p class="text-xs text-muted">
              {{ t.by(suggestion.login) }} ·
              <ULink :to="suggestion.url" target="_blank" class="text-highlighted underline underline-offset-2">
                {{ t.viewPull }} #{{ suggestion.number }}
              </ULink>
            </p>
          </div>
        </section>

        <UButton
          v-if="!role"
          :to="signInUrl"
          external
          icon="i-simple-icons-github"
          color="neutral"
          :label="t.signIn"
          block
        />

        <template v-else>
          <UAlert
            v-if="role === 'suggester'"
            color="neutral"
            variant="subtle"
            icon="i-lucide-git-pull-request"
            :description="t.suggesterNote"
          />

          <div v-if="staleIssue" class="space-y-2 rounded-md border border-(--l10n-warning) p-3" role="alert" data-l10n-stale>
            <p class="flex gap-1.5 font-medium text-highlighted">
              <UIcon name="i-lucide-git-compare" class="size-4 shrink-0 translate-y-0.5 text-(--l10n-warning)" />
              {{ t.issues.stale }}
            </p>
            <div v-if="staleIssue.current" class="space-y-0.5">
              <p class="text-xs font-medium uppercase text-muted">
                {{ t.current }}
              </p>
              <p v-if="staleIssue.current.text !== null" class="text-highlighted">
                <DocsL10nSkeleton :skeleton="staleIssue.current.text" :placeholders="segment.placeholders" />
              </p>
              <p v-else class="text-muted">
                {{ t.none }}
              </p>
            </div>
            <p class="text-xs text-toned">
              {{ t.staleHint }}
            </p>
            <UButton
              :label="t.reloadCurrent"
              icon="i-lucide-refresh-cw"
              color="neutral"
              variant="outline"
              size="sm"
              @click="reload(staleIssue.hash)"
            />
          </div>

          <UFormField
            :label="t.yours"
            :description="segment.placeholders.length ? t.placeholders : undefined"
            :error="errorMessage"
            :help="validation?.warnings.map(warning => warning.message).join(' ') || undefined"
            :ui="{ label: 'text-xs font-medium uppercase text-muted', description: 'text-xs', error: 'text-xs text-(--l10n-error)', help: 'text-xs text-(--l10n-warning)' }"
          >
            <template #hint>
              <UButton
                :label="t.fromSource"
                icon="i-lucide-copy"
                color="neutral"
                variant="link"
                size="xs"
                class="p-0"
                :disabled="draft === segment.skeleton"
                @click="draft = segment.skeleton"
              />
            </template>

            <UTextarea
              ref="draftField"
              v-model="draft"
              :rows="3"
              autoresize
              class="w-full"
              :lang="locale"
            />

            <template v-if="errorMessage" #error>
              <ul class="space-y-0.5">
                <li v-for="error in validation?.errors" :key="error.code + error.at" lang="en">
                  {{ error.message }}
                </li>
                <template v-if="fieldIssue && !validation?.errors.length">
                  <li>{{ t.issues[fieldIssue.code] }}</li>
                  <li v-for="error in fieldIssue.errors" :key="error.code + error.at" lang="en">
                    {{ error.message }}
                  </li>
                </template>
              </ul>
            </template>
            <template v-if="validation?.warnings.length" #help>
              <ul lang="en" class="space-y-0.5">
                <li v-for="warning in validation?.warnings" :key="warning.code + warning.at">
                  {{ warning.message }}
                </li>
              </ul>
            </template>
          </UFormField>

          <div class="flex flex-wrap items-center gap-2">
            <UTooltip :text="t.edit" :kbds="['meta', 'enter']">
              <UButton :label="t.edit" icon="i-lucide-pencil" :disabled="!canEdit" @click="stage('edit')" />
            </UTooltip>
            <template v-if="segment.record">
              <UButton
                v-if="role === 'translator'"
                :label="t.verify"
                icon="i-lucide-check"
                color="neutral"
                variant="outline"
                :disabled="segment.status === 'verified' || segment.status === 'rejected' || changed"
                @click="stage('verify')"
              />
              <UButton
                :label="t.reject"
                icon="i-lucide-x"
                color="neutral"
                variant="outline"
                :disabled="rejected"
                @click="stage('reject')"
              />
            </template>
            <UButton v-if="staged" :label="t.undo" color="neutral" variant="ghost" @click="unstage()" />
          </div>
          <p v-if="staged" class="text-xs text-toned">
            {{ t.staged[staged.action] }}<template v-if="staged.action === 'reject'">
              : {{ t.rejectHint }}
            </template>
          </p>
        </template>

        <UCollapsible v-if="otherCount" v-model:open="otherOpen" class="border-t border-default pt-4" data-l10n-other-texts>
          <UButton
            :label="`${t.otherTexts} (${t.otherTextsCount(otherCount)})`"
            color="neutral"
            variant="link"
            size="sm"
            trailing-icon="i-lucide-chevron-down"
            class="group p-0 font-medium"
            :ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform' }"
          />
          <template #content>
            <div class="mt-2 space-y-4">
              <p class="text-xs text-muted">
                {{ t.otherTextsHint }}
              </p>
              <p class="grid grid-cols-2 gap-2 px-2 text-xs font-medium uppercase text-muted" aria-hidden="true">
                <span>{{ t.english }}</span>
                <span>{{ t.translation }}</span>
              </p>
              <section v-for="group in otherGroups" :key="`${group.type}:${group.heading ?? ''}`" class="space-y-1">
                <h3 class="text-xs font-medium text-toned" :lang="groupLabel(group).lang">
                  {{ groupLabel(group).text }}
                </h3>
                <ul class="space-y-1">
                  <li v-for="item in group.segments" :key="item.hash">
                    <button
                      type="button"
                      class="w-full rounded-md border p-2 text-start text-xs transition-colors hover:bg-elevated focus-visible:outline-2 focus-visible:outline-primary"
                      :class="item.hash === segment.hash ? 'border-primary bg-elevated' : 'border-default'"
                      :aria-current="item.hash === segment.hash ? 'true' : undefined"
                      :aria-label="`${t.editThis} : ${where(item)}`"
                      @click="select(item.hash)"
                    >
                      <span class="block text-muted">{{ where(item) }}</span>
                      <span class="mt-1 grid grid-cols-2 gap-2">
                        <span lang="en" class="text-toned">
                          <span class="sr-only" :lang="locale">{{ t.english }} : </span>
                          <DocsL10nSkeleton :skeleton="item.skeleton" :placeholders="item.placeholders" />
                        </span>
                        <span v-if="item.record" :lang="locale" class="text-highlighted">
                          <DocsL10nSkeleton :skeleton="item.record.text" :placeholders="item.placeholders" />
                        </span>
                        <span v-else class="text-muted">{{ t.untranslatedShort }}</span>
                      </span>
                    </button>
                  </li>
                </ul>
              </section>
            </div>
          </template>
        </UCollapsible>
      </template>
    </template>

    <template v-if="role" #footer>
      <div class="w-full space-y-3 text-sm">
        <div role="status">
          <span class="sr-only">{{ announcement }}</span>
          <UAlert
            v-if="failure"
            color="neutral"
            variant="subtle"
            icon="i-lucide-circle-alert"
            :ui="{ icon: 'text-(--l10n-error)' }"
            :description="failure"
          />
          <UAlert
            v-else-if="result?.dryRun"
            color="neutral"
            variant="subtle"
            icon="i-lucide-flask-conical"
            :description="t.dryRun"
          />
          <p v-if="saving" class="flex items-center gap-1.5 text-xs text-toned" data-l10n-save-state="saving">
            <UIcon name="i-lucide-loader-circle" class="size-3.5 shrink-0 animate-spin motion-reduce:animate-none" />
            {{ t.saving(changes.size) }}
          </p>
          <p v-else-if="publication" class="flex gap-1.5 text-xs text-toned" :data-l10n-save-state="publication.state">
            <UIcon
              :name="publication.state === 'online' ? 'i-lucide-circle-check' : publication.state === 'slow' ? 'i-lucide-clock' : 'i-lucide-loader-circle'"
              class="size-3.5 shrink-0 translate-y-0.5"
              :class="publication.state === 'online' ? 'text-(--l10n-success)' : publication.state === 'publishing' ? 'animate-spin motion-reduce:animate-none' : undefined"
            />
            <span>
              <span class="font-medium text-highlighted">{{ t.state[publication.state].label }}</span>
              ({{ t.commit }} <ULink :to="commitUrl" target="_blank" class="font-mono underline underline-offset-2">{{ publication.sha.slice(0, 7) }}</ULink>) : {{ t.state[publication.state].hint }}
            </span>
          </p>
          <p v-else-if="result?.pull" class="flex gap-1.5 text-xs text-toned" data-l10n-save-state="proposed">
            <UIcon name="i-lucide-git-pull-request" class="size-3.5 shrink-0 translate-y-0.5 text-(--l10n-success)" />
            <span>
              {{ t.proposedIn(result.pull.number) }}
              <ULink :to="result.pull.url" target="_blank" class="underline underline-offset-2">{{ t.viewPull }}</ULink>
            </span>
          </p>
        </div>

        <div v-if="issues.length" class="space-y-1 rounded-md border border-default p-2 text-xs" data-l10n-not-saved>
          <p class="font-medium text-highlighted">
            {{ t.notSaved(issues.length) }}
          </p>
          <ul class="max-h-32 space-y-1 overflow-y-auto">
            <li v-for="item in issues" :key="item.hash" class="flex flex-wrap items-baseline gap-x-2">
              <UButton
                :label="excerpt(item.hash)"
                lang="en"
                color="neutral"
                variant="link"
                size="xs"
                class="max-w-full p-0"
                :ui="{ label: 'truncate' }"
                @click="hash = item.hash"
              />
              <span class="text-toned">{{ t.issues[item.code] }}</span>
            </li>
          </ul>
        </div>

        <p v-if="Object.keys(suggestions).length" class="text-xs text-toned">
          {{ t.suggestionCount(Object.keys(suggestions).length) }}
        </p>

        <UCollapsible v-if="changes.size">
          <UButton
            :label="t.pendingChanges(changes.size)"
            color="neutral"
            variant="link"
            size="xs"
            trailing-icon="i-lucide-chevron-down"
            class="group p-0"
            :ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform' }"
          />
          <template #content>
            <ul class="mt-2 max-h-40 space-y-1 overflow-y-auto">
              <li v-for="change in changes.values()" :key="change.hash" class="flex items-center gap-2">
                <UBadge :label="t.staged[change.action]" color="neutral" variant="subtle" size="sm" class="shrink-0" />
                <UButton
                  :label="excerpt(change.hash)"
                  lang="en"
                  color="neutral"
                  variant="link"
                  size="xs"
                  class="min-w-0 flex-1 p-0"
                  :ui="{ label: 'truncate' }"
                  @click="hash = change.hash"
                />
                <UButton
                  icon="i-lucide-undo-2"
                  :aria-label="`${t.undo} : ${excerpt(change.hash)}`"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  @click="unstage(change.hash)"
                />
              </li>
            </ul>
          </template>
        </UCollapsible>
        <p v-if="changes.size && !saving" class="-mt-2 text-xs text-muted" data-l10n-save-state="staged">
          {{ t.stagedHint }}
        </p>

        <UButton
          v-if="changes.size && !noteOpen && !note"
          :label="t.noteAdd"
          icon="i-lucide-message-square-plus"
          color="neutral"
          variant="link"
          size="xs"
          class="p-0"
          @click="openNote"
        />
        <UFormField
          v-else-if="changes.size"
          :label="t.noteLabel"
          :help="t.noteHelp(role ?? 'suggester')"
          :hint="note.length ? `${note.length}/${L10N_NOTE_MAX_LENGTH}` : undefined"
          :ui="{ label: 'text-xs font-medium text-toned', help: 'text-xs', hint: 'text-xs' }"
        >
          <UTextarea
            ref="noteField"
            v-model="note"
            :maxlength="L10N_NOTE_MAX_LENGTH"
            :rows="1"
            autoresize
            :maxrows="4"
            class="w-full"
            :lang="locale"
            data-l10n-note
            @keydown.meta.enter.prevent.stop="save"
            @keydown.ctrl.enter.prevent.stop="save"
          />
        </UFormField>

        <div class="flex flex-wrap items-center gap-2">
          <UButton
            :label="role === 'translator' ? t.publish(changes.size) : t.propose(changes.size)"
            :loading="saving"
            :disabled="!changes.size"
            icon="i-lucide-upload"
            @click="save"
          />
          <UButton
            v-if="role === 'translator' && machine.length"
            :label="t.verifyAll(machine.length)"
            color="neutral"
            variant="outline"
            @click="confirmVerifyAll = true"
          />
        </div>
      </div>

      <UModal
        v-model:open="confirmVerifyAll"
        :title="t.verifyAll(machine.length)"
        :description="t.verifyAllConfirm(machine.length)"
        :close="closeButton"
      >
        <template #footer>
          <div class="flex gap-2 ms-auto">
            <UButton :label="t.cancel" color="neutral" variant="ghost" @click="confirmVerifyAll = false" />
            <UButton :label="t.confirm" @click="verifyAll" />
          </div>
        </template>
      </UModal>
    </template>
  </USlideover>
</template>
