<script setup lang="ts">
import { validate } from '@diglot/core'
import type { ButtonProps } from '@nuxt/ui'
import { L10N_STRINGS, l10nEditorPath, l10nTranslationsPath, localisePath, type L10nChange, type L10nChangeIssue, type L10nEditorPage, type L10nLocale, type L10nSaveResult } from '#shared/utils/l10n'

const props = defineProps<{
  locale: L10nLocale
  /** The English page, unprefixed. */
  path: string
  /** The rendered document, whose blocks carry `data-l10n-hash`. */
  target?: HTMLElement | null
}>()

const emit = defineEmits<{
  /** The saved changes are now served: the page can be fetched again. */
  published: []
}>()

const open = defineModel<boolean>('open', { default: false })
const hash = defineModel<string | undefined>('hash')

const strings = computed(() => L10N_STRINGS[props.locale])
const t = computed(() => strings.value.editor)
const toast = useToast()
/** Close buttons labelled in the page's language. */
const closeButton = computed(() => ({ 'aria-label': t.value.close }) as ButtonProps)
const reducedMotion = usePreferredReducedMotion()

const { data: page, refresh, status: loading } = useFetch<L10nEditorPage>(() => l10nEditorPath(props.locale, props.path), {
  server: false,
  immediate: false,
  watch: false
})

watch(open, (value) => {
  if (value && !page.value) refresh()
}, { immediate: true })

const segments = computed(() => page.value?.segments ?? [])

const index = computed(() => segments.value.findIndex(segment => segment.hash === hash.value))
const segment = computed(() => segments.value[index.value])
const role = computed(() => page.value?.role)

function go(offset: number) {
  const next = segments.value[index.value + offset]
  if (next) hash.value = next.hash
}

const storageKey = `docs-l10n:${props.locale}:${props.path}`
const changes = useLocalStorage(`${storageKey}:changes`, new Map<string, L10nChange>())
const drafts = useLocalStorage(`${storageKey}:drafts`, new Map<string, string>())

watch([segments, hash], ([list, current]) => {
  if (!list.length) return
  if (!list.some(item => item.hash === current)) hash.value = list[0]!.hash
  const published = new Map(list.map(item => [item.hash, item.record?.text ?? null]))
  const stale: L10nChangeIssue[] = []
  for (const [key, change] of [...changes.value]) {
    if (!published.has(key)) {
      changes.value.delete(key)
    } else if (change.base !== published.get(key)) {
      changes.value.delete(key)
      if (change.action === 'edit' && change.text && !drafts.value.has(key)) drafts.value.set(key, change.text)
      stale.push({ hash: key, code: 'stale', message: 'The translation changed since this change was made: review it again.' })
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

const validation = computed(() => segment.value && draft.value.trim() ? validate(draft.value.trim(), segment.value) : undefined)
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
const errorMessage = computed(() => validation.value?.errors[0]?.message ?? issue.value?.message)

let disposed = false
onScopeDispose(() => {
  disposed = true
  for (const block of active) block.removeAttribute('data-l10n-active')
})

/** Whether the editor's page shows every saved segment as saved. */
function served(saved: L10nSaveResult['segments']): boolean {
  return Object.entries(saved).every(([key, { status, text }]) => {
    const item = segments.value.find(other => other.hash === key)
    return !item || (item.status === status && item.record?.text === text)
  })
}

async function waitForPublication(saved: L10nSaveResult['segments']) {
  for (let attempt = 0; attempt < 20; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 3000))
    if (disposed) return
    await refresh()
    if (served(saved)) {
      emit('published')
      toast.add({ title: t.value.publishedNow, icon: 'i-lucide-check', color: 'success' })
      return
    }
  }
  toast.add({ title: t.value.publishSlow, icon: 'i-lucide-clock', color: 'neutral' })
}

async function save() {
  if (!changes.value.size || saving.value) return
  saving.value = true
  failure.value = undefined
  result.value = undefined
  issues.value = []
  try {
    const response = await $fetch<L10nSaveResult>(l10nTranslationsPath(props.locale), {
      method: 'POST',
      body: { page: props.path, changes: [...changes.value.values()] }
    })
    result.value = response
    changes.value.clear()
    if (response.mode === 'commit' && !response.dryRun) {
      for (const [hash, { status }] of Object.entries(response.segments)) {
        for (const block of blocks(hash)) block.setAttribute('data-l10n', status)
      }
      waitForPublication(response.segments)
    }
  } catch (error) {
    const data = (error as { data?: { statusMessage?: string, data?: { issues?: L10nChangeIssue[] } } }).data
    issues.value = data?.data?.issues ?? []
    failure.value = data?.statusMessage ?? t.value.failed
    if (issues.value[0]) hash.value = issues.value[0].hash
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
              v-model="draft"
              :rows="3"
              autoresize
              class="w-full"
              :lang="locale"
            />

            <template v-if="errorMessage" #error>
              <ul lang="en" class="space-y-0.5">
                <li v-for="error in validation?.errors" :key="error.code + error.at">
                  {{ error.message }}
                </li>
                <li v-if="issue">
                  {{ issue.message }}
                </li>
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
          <UAlert
            v-else-if="result"
            color="neutral"
            variant="subtle"
            icon="i-lucide-circle-check"
            :ui="{ icon: 'text-(--l10n-success)' }"
            :description="result.mode === 'commit' ? t.published : t.proposed"
            :actions="result.pull ? [{ label: t.viewPull, to: result.pull.url, target: '_blank', color: 'neutral', variant: 'outline' }] : undefined"
          />
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
