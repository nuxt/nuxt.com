import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { createError, readBody } from 'h3'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { UApp } from '#components'
import DocsL10nEditor from '~/components/DocsL10nEditor.vue'
import type { L10nChange, L10nChangeIssue, L10nEditorPage, L10nEditorSegment, L10nSaveResult } from '#shared/utils/l10n'

const FIRST = '1111111111111111'
const SECOND = '2222222222222222'
const PATH = '/docs/4.x/getting-started/installation'
const SHA = 'c0ffee1234567890c0ffee1234567890c0ffee12'

const segment = (hash: string, skeleton: string, text: string): L10nEditorSegment => ({
  hash,
  kind: 'paragraph',
  format: 'markdown',
  skeleton,
  words: 2,
  placeholders: [],
  context: { headingTrail: [], containers: [] },
  status: 'machine',
  record: { text, origin: 'mt', review: 'none', updatedAt: '2026-11-04T00:00:00.000Z' },
  glossary: []
})

registerEndpoint(`/api/l10n/fr/editor${PATH}`, (): L10nEditorPage => ({
  sha: 'served',
  role: 'translator',
  segments: [segment(FIRST, 'Hello world', 'Bonjour le monde'), segment(SECOND, 'Good night', 'Bonne nuit')]
}))

const branch = new Map<string, string | null>()
const saves: Array<{ changes: L10nChange[], note?: string }> = []

registerEndpoint('/api/l10n/fr/translations', {
  method: 'POST',
  handler: async (event) => {
    const body = await readBody<{ changes: L10nChange[], note?: string }>(event)
    saves.push(body)
    const issues: L10nChangeIssue[] = []
    const segments: L10nSaveResult['segments'] = {}
    for (const change of body.changes) {
      const current = branch.get(change.hash) ?? null
      if (change.base !== current) {
        issues.push({ hash: change.hash, code: 'stale', message: 'stale', current: { text: current, status: current === null ? 'untranslated' : 'edited' } })
        continue
      }
      const text = change.text ?? current!
      branch.set(change.hash, text)
      segments[change.hash] = { status: change.action === 'verify' ? 'verified' : 'edited', text }
    }
    if (!Object.keys(segments).length) {
      throw createError({ statusCode: 422, statusMessage: 'No change can be saved', data: { issues } })
    }
    return { mode: 'commit', sha: SHA, segments, ...(issues.length ? { issues } : {}) } satisfies L10nSaveResult
  }
})

beforeEach(() => {
  branch.clear()
  branch.set(FIRST, 'Bonjour le monde')
  branch.set(SECOND, 'Bonne nuit')
  saves.length = 0
})

const mounted: Array<{ unmount: () => void }> = []

afterEach(() => {
  for (const wrapper of mounted.splice(0)) wrapper.unmount()
  document.body.innerHTML = ''
  localStorage.clear()
})

const button = (label: string | RegExp) => [...document.querySelectorAll<HTMLButtonElement>('[role="dialog"] button')]
  .find(item => typeof label === 'string' ? item.textContent?.trim() === label : label.test(item.textContent?.trim() ?? ''))

async function mountEditor(hash = FIRST) {
  mounted.push(await mountSuspended({ render: () => h(UApp, () => h(DocsL10nEditor, { locale: 'fr', path: PATH, open: true, hash })) }, { attachTo: document.body }))
  return vi.waitFor(() => {
    const found = document.querySelector<HTMLTextAreaElement>('[role="dialog"] textarea')
    if (!found?.value) throw new Error('the editor has not loaded')
    return found
  })
}

async function type(textarea: HTMLTextAreaElement, value: string) {
  textarea.value = value
  textarea.dispatchEvent(new Event('input'))
  await vi.waitFor(() => expect(button('Modifier')?.disabled).toBe(false))
}

async function publish() {
  const count = saves.length
  await vi.waitFor(() => expect(button(/^Publier \d/)?.disabled).toBe(false))
  button(/^Publier \d/)!.click()
  await vi.waitFor(() => expect(saves).toHaveLength(count + 1))
  await vi.waitFor(() => expect(document.querySelector('[data-l10n-save-state="saving"]')).toBeNull())
}

describe('DocsL10nEditor saves', () => {
  it('should base a change to a segment saved earlier on the saved translation, before the page shows it', async () => {
    const textarea = await mountEditor()
    await type(textarea, 'Salut le monde')
    button('Modifier')!.click()
    await publish()
    expect(saves[0]!.changes).toEqual([{ hash: FIRST, action: 'edit', text: 'Salut le monde', base: 'Bonjour le monde' }])

    await vi.waitFor(() => expect(document.querySelector('[data-l10n-save-state="publishing"]')?.textContent).toContain(SHA.slice(0, 7)))
    expect(document.querySelector<HTMLAnchorElement>('[data-l10n-save-state="publishing"] a')?.href).toBe(`https://github.com/nuxt/translations/commit/${SHA}`)

    await vi.waitFor(() => expect(button('Valider')?.disabled).toBe(false))
    button('Valider')!.click()
    await publish()

    expect(saves[1]!.changes).toEqual([{ hash: FIRST, action: 'verify', base: 'Salut le monde' }])
    expect(document.querySelector('[data-l10n-not-saved]')).toBeNull()
    expect(document.querySelector('[data-l10n-stale]')).toBeNull()
  })

  it('should show the current translation of a stale change, and apply the change again on top of it', async () => {
    branch.set(FIRST, 'Coucou le monde')
    const textarea = await mountEditor()
    await type(textarea, 'Salut le monde')
    button('Modifier')!.click()
    await publish()

    const stale = await vi.waitFor(() => {
      const found = document.querySelector('[data-l10n-stale]')
      if (!found) throw new Error('no stale change')
      return found
    })
    expect(stale.textContent).toContain('Coucou le monde')
    expect(document.querySelector('[data-l10n-not-saved]')?.textContent).toContain('La traduction a changé depuis votre modification.')
    expect(textarea.value).toBe('Salut le monde')

    button('Recharger la traduction actuelle')!.click()
    await vi.waitFor(() => expect(document.querySelector('[data-l10n-stale]')).toBeNull())
    expect(document.querySelector<HTMLTextAreaElement>('[role="dialog"] textarea')!.value).toBe('Salut le monde')

    await vi.waitFor(() => expect(button('Modifier')?.disabled).toBe(false))
    button('Modifier')!.click()
    await publish()
    expect(saves[1]!.changes).toEqual([{ hash: FIRST, action: 'edit', text: 'Salut le monde', base: 'Coucou le monde' }])
    expect(branch.get(FIRST)).toBe('Salut le monde')
  })

  it('should keep a change staged against an older page as a draft next to the current translation', async () => {
    localStorage.setItem(`docs-l10n:fr:${PATH}:changes`, JSON.stringify([[FIRST, { hash: FIRST, action: 'edit', text: 'Salut le monde', base: 'Allô le monde' }]]))
    const textarea = await mountEditor()

    const stale = await vi.waitFor(() => {
      const found = document.querySelector('[data-l10n-stale]')
      if (!found) throw new Error('no stale change')
      return found
    })
    expect(stale.textContent).toContain('La traduction a changé depuis votre modification.')
    expect(stale.textContent).toContain('Bonjour le monde')
    expect(textarea.value).toBe('Salut le monde')
    expect(button(/^Publier/)?.disabled).toBe(true)

    button('Recharger la traduction actuelle')!.click()
    await vi.waitFor(() => expect(button('Modifier')?.disabled).toBe(false))
    button('Modifier')!.click()
    await publish()
    expect(saves[0]!.changes).toEqual([{ hash: FIRST, action: 'edit', text: 'Salut le monde', base: 'Bonjour le monde' }])
  })

  it('should save the changes that can be saved and list the others', async () => {
    branch.set(SECOND, 'Bonne soirée')
    await mountEditor()
    await vi.waitFor(() => expect(button('Valider')?.disabled).toBe(false))
    button('Valider')!.click()
    document.querySelector<HTMLButtonElement>('[aria-label="Passage suivant"]')!.click()
    await vi.waitFor(() => expect(document.querySelector<HTMLTextAreaElement>('[role="dialog"] textarea')!.value).toBe('Bonne nuit'))
    button('Valider')!.click()
    await publish()

    expect(saves[0]!.changes.map(change => change.hash)).toEqual([FIRST, SECOND])
    const list = await vi.waitFor(() => {
      const found = document.querySelector('[data-l10n-not-saved]')
      if (!found) throw new Error('no list')
      return found
    })
    expect(list.textContent).toContain('1 changement non enregistré')
    expect(list.textContent).toContain('Good night')
    expect(document.querySelector('[data-l10n-save-state="publishing"]')).not.toBeNull()
    expect(button(/^Publier 1 changement$/)).toBeDefined()
    expect(branch.get(FIRST)).toBe('Bonjour le monde')
  })
})
