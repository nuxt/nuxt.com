import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { UApp } from '#components'
import DocsL10nEditor from '~/components/DocsL10nEditor.vue'
import type { L10nEditorPage } from '#shared/utils/l10n'

const HASH = '0123456789abcdef'
const PATH = '/docs/4.x/getting-started/introduction'

registerEndpoint(`/api/l10n/fr/editor${PATH}`, (): L10nEditorPage => ({
  sha: 'sha',
  role: 'translator',
  segments: [{ hash: HASH, kind: 'paragraph', format: 'markdown', skeleton: 'Hello', words: 1, placeholders: [], context: { headingTrail: [], containers: [] }, status: 'untranslated', glossary: [] }]
}))

afterEach(() => {
  document.body.innerHTML = ''
  localStorage.clear()
})

describe('DocsL10nEditor', () => {
  it('should refuse a translation much longer than its source before it is staged', async () => {
    await mountSuspended({ render: () => h(UApp, () => h(DocsL10nEditor, { locale: 'fr', path: PATH, open: true, hash: HASH })) }, { attachTo: document.body })

    const textarea = await vi.waitFor(() => {
      const found = document.querySelector('textarea')
      if (!found) throw new Error('the editor has not loaded')
      return found
    })
    textarea.value = 'Bonjour '.repeat(20)
    textarea.dispatchEvent(new Event('input'))

    await vi.waitFor(() => expect(document.body.textContent).toContain('translation is longer than 120 characters'))
    const edit = [...document.querySelectorAll('button')].find(button => button.textContent?.trim() === 'Modifier')
    expect(edit?.disabled).toBe(true)
  })
})

const CODE_PATH = '/docs/4.x/getting-started/configuration'
const COMMENT = 'fedcba9876543210'

registerEndpoint(`/api/l10n/fr/editor${CODE_PATH}`, (): L10nEditorPage => ({
  sha: 'sha',
  role: 'translator',
  segments: [
    { hash: HASH, kind: 'paragraph', format: 'markdown', skeleton: 'Hello', words: 1, placeholders: [], context: { headingTrail: [], containers: [] }, status: 'untranslated', glossary: [] },
    { hash: COMMENT, kind: 'code-comment', format: 'plain', skeleton: 'My Nuxt config', words: 3, placeholders: [], context: { headingTrail: [], containers: [], detail: 'ts' }, status: 'untranslated', glossary: [] }
  ]
}))

describe('DocsL10nEditor code policy', () => {
  it.each([
    ['a paragraph', HASH],
    ['a code comment', COMMENT]
  ])('should explain once that code is not translated, with %s selected', async (_, hash) => {
    await mountSuspended({ render: () => h(UApp, () => h(DocsL10nEditor, { locale: 'fr', path: CODE_PATH, open: true, hash })) }, { attachTo: document.body })

    await vi.waitFor(() => expect(document.querySelector('[data-l10n-other-texts]')).not.toBeNull())
    const lines = document.querySelectorAll('[data-l10n-code-policy]')
    expect(lines).toHaveLength(1)
    expect(!!lines[0]!.closest('[data-l10n-other-texts]')).toBe(hash === HASH)
  })
})
