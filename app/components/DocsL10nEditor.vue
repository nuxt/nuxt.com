<script setup lang="ts">
import { validate } from '@diglot/core'
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

const { data: page, refresh, status: loading } = useFetch<L10nEditorPage>(() => l10nEditorPath(props.locale, props.path), {
  server: false,
  immediate: false,
  watch: false
})

watch(open, (value) => {
  if (value && !page.value) refresh()
}, { immediate: true })

const segments = computed(() => page.value?.segments ?? [])

watch([segments, hash], ([list, current]) => {
  if (list.length && !list.some(item => item.hash === current)) hash.value = list[0]!.hash
})
const index = computed(() => segments.value.findIndex(segment => segment.hash === hash.value))
const segment = computed(() => segments.value[index.value])
const role = computed(() => page.value?.role)

function go(offset: number) {
  const next = segments.value[index.value + offset]
  if (next) hash.value = next.hash
}

const changes = reactive(new Map<string, L10nChange>())
const drafts = reactive(new Map<string, string>())

const draft = computed({
  get: () => segment.value ? drafts.get(segment.value.hash) ?? changes.get(segment.value.hash)?.text ?? segment.value.record?.text ?? '' : '',
  set: (value: string) => {
    if (segment.value) drafts.set(segment.value.hash, value)
  }
})

const validation = computed(() => segment.value && draft.value.trim() ? validate(draft.value.trim(), segment.value) : undefined)
const changed = computed(() => !!segment.value && draft.value.trim() !== (segment.value.record?.text ?? ''))
const rejected = computed(() => segment.value?.record?.review === 'rejected')
const staged = computed(() => segment.value && changes.get(segment.value.hash))

function stage(action: L10nChange['action']) {
  const current = segment.value
  if (!current) return
  changes.set(current.hash, action === 'edit' ? { hash: current.hash, action, text: draft.value.trim() } : { hash: current.hash, action })
  drafts.delete(current.hash)
  issues.value = issues.value.filter(issue => issue.hash !== current.hash)
}

function unstage() {
  if (!segment.value) return
  changes.delete(segment.value.hash)
  drafts.delete(segment.value.hash)
}

const machine = computed(() => segments.value.filter(item => item.status === 'machine' && !changes.has(item.hash)))
const confirmVerifyAll = ref(false)

function verifyAll() {
  for (const item of machine.value) changes.set(item.hash, { hash: item.hash, action: 'verify' })
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

watch(() => [...changes.keys()], (hashes, before = []) => {
  for (const hash of before) for (const block of blocks(hash)) block.removeAttribute('data-l10n-staged')
  for (const hash of hashes) for (const block of blocks(hash)) block.setAttribute('data-l10n-staged', changes.get(hash)!.action)
})

const saving = ref(false)
const result = ref<L10nSaveResult>()
const failure = ref<string>()
const issues = ref<L10nChangeIssue[]>([])
const issue = computed(() => issues.value.find(item => item.hash === segment.value?.hash))

async function waitForPublication(previous: string) {
  for (let attempt = 0; attempt < 20; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 3000))
    await refresh()
    if (page.value?.sha && page.value.sha !== previous) {
      emit('published')
      return
    }
  }
}

async function save() {
  if (!changes.size || saving.value) return
  saving.value = true
  failure.value = undefined
  result.value = undefined
  issues.value = []
  try {
    const response = await $fetch<L10nSaveResult>(l10nTranslationsPath(props.locale), {
      method: 'POST',
      body: { page: props.path, changes: [...changes.values()] }
    })
    result.value = response
    changes.clear()
    if (response.mode === 'commit' && !response.dryRun) {
      for (const [hash, { status }] of Object.entries(response.segments)) {
        for (const block of blocks(hash)) block.setAttribute('data-l10n', status)
      }
      waitForPublication(page.value?.sha ?? '')
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
    :dismissible="false"
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
        <span v-if="index >= 0">{{ t.position(index + 1, segments.length) }}</span>
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
      <p v-if="loading === 'pending' && !page" class="text-dimmed">
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

        <section v-if="segment.previous" class="space-y-1 rounded-md bg-warning/10 p-3">
          <p class="text-xs text-warning">
            {{ t.changedSentences }}
          </p>
          <p v-for="sentence in segment.previous.changed" :key="sentence" lang="en" class="bg-warning/20 rounded px-1">
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
              <span v-if="entry.note" lang="en" class="text-dimmed"> ({{ entry.note }})</span>
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
          <p v-else class="text-dimmed">
            {{ t.none }}
          </p>
          <p v-if="segment.record?.rejectedBy" class="text-xs text-error">
            {{ t.rejectedBy(segment.record.rejectedBy) }}
          </p>
          <p v-else-if="segment.record?.verifiedBy || segment.record?.by || segment.record?.model" class="text-xs text-dimmed">
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
            <p v-else class="text-error">
              {{ t.suggestedReject }}
            </p>
            <p class="text-xs text-dimmed">
              {{ t.by(suggestion.login) }} ·
              <a :href="suggestion.url" target="_blank" class="text-primary underline underline-offset-2">{{ t.viewPull }} #{{ suggestion.number }}</a>
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
          <UAlert v-if="role === 'suggester'" color="info" variant="subtle" :description="t.suggesterNote" />

          <section class="space-y-2">
            <label :for="`l10n-draft-${segment.hash}`" class="text-xs font-medium uppercase text-muted">{{ t.yours }}</label>
            <UTextarea
              :id="`l10n-draft-${segment.hash}`"
              v-model="draft"
              :rows="3"
              autoresize
              class="w-full"
              :color="validation && !validation.ok ? 'error' : undefined"
              :highlight="!!validation && !validation.ok"
              :lang="locale"
            />
            <p v-if="segment.placeholders.length" class="text-xs text-dimmed">
              {{ t.placeholders }}
            </p>
            <ul v-if="validation?.errors.length || validation?.warnings.length || issue" lang="en" class="text-xs space-y-0.5">
              <li v-for="error in validation?.errors" :key="error.code + error.at" class="text-error">
                {{ error.message }}
              </li>
              <li v-for="warning in validation?.warnings" :key="warning.code + warning.at" class="text-warning">
                {{ warning.message }}
              </li>
              <li v-if="issue" class="text-error">
                {{ issue.message }}
              </li>
            </ul>
          </section>

          <div class="flex flex-wrap items-center gap-2">
            <UButton :label="t.edit" icon="i-lucide-pencil" :disabled="!(changed || rejected) || !validation?.ok" @click="stage('edit')" />
            <template v-if="segment.record">
              <UButton
                v-if="role === 'translator'"
                :label="t.verify"
                icon="i-lucide-check"
                color="success"
                variant="soft"
                :disabled="segment.status === 'verified' || segment.status === 'rejected' || changed"
                @click="stage('verify')"
              />
              <UButton
                :label="t.reject"
                icon="i-lucide-x"
                color="error"
                variant="soft"
                :disabled="rejected"
                @click="stage('reject')"
              />
            </template>
            <UButton v-if="staged" :label="t.undo" color="neutral" variant="ghost" @click="unstage" />
          </div>
          <p v-if="staged" class="text-xs text-info">
            {{ t.staged[staged.action] }}<template v-if="staged.action === 'reject'">
              : {{ t.rejectHint }}
            </template>
          </p>
        </template>
      </template>
    </template>

    <template v-if="role" #footer>
      <div class="w-full space-y-2 text-sm">
        <UAlert v-if="failure" color="error" variant="subtle" :description="failure" />
        <UAlert v-else-if="result?.dryRun" color="warning" variant="subtle" :description="t.dryRun" />
        <UAlert
          v-else-if="result"
          color="success"
          variant="subtle"
          :description="result.mode === 'commit' ? t.published : t.proposed"
          :actions="result.pull ? [{ label: t.viewPull, to: result.pull.url, target: '_blank', color: 'neutral', variant: 'outline' }] : undefined"
        />

        <p v-if="Object.keys(suggestions).length" class="text-xs text-info">
          {{ t.suggestionCount(Object.keys(suggestions).length) }}
        </p>

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

      <UModal v-model:open="confirmVerifyAll" :title="t.verifyAll(machine.length)" :description="t.verifyAllConfirm(machine.length)">
        <template #footer>
          <div class="flex gap-2 ms-auto">
            <UButton :label="t.cancel" color="neutral" variant="ghost" @click="confirmVerifyAll = false" />
            <UButton :label="t.confirm" color="success" @click="verifyAll" />
          </div>
        </template>
      </UModal>
    </template>
  </USlideover>
</template>
