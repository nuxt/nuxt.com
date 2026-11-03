import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { UApp } from '#components'
import DocsL10nStatus from '~/components/DocsL10nStatus.vue'
import type { L10nPageMeta } from '#shared/utils/l10n'

const HASH = '0123456789abcdef'
const PATH = '/docs/4.x/getting-started/introduction'
const META: L10nPageMeta = { locale: 'fr', sha: 'sha', coverage: { words: 2, byStatus: { machine: 2 } } }

registerEndpoint(`/api/l10n/fr/source/${HASH}${PATH}`, () => ({ hash: HASH, source: 'Hello', status: 'machine' }))

function renderDocument() {
  const target = document.createElement('div')
  target.innerHTML = `<p data-l10n="machine" data-l10n-hash="${HASH}">Bonjour</p>`
  document.body.append(target)
  return { target, block: target.querySelector('p')! }
}

function mountStatus(target: HTMLElement) {
  return mountSuspended({ render: () => h(UApp, () => h(DocsL10nStatus, { meta: META, path: PATH, target, show: true })) }, { attachTo: document.body })
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('DocsL10nStatus', () => {
  it('should make blocks focusable and describe them in review mode', async () => {
    const { target, block } = renderDocument()
    await mountStatus(target)

    await vi.waitFor(() => expect(block.tabIndex).toBe(0))
    const description = document.getElementById(block.getAttribute('aria-describedby')!)
    expect(description?.textContent).toContain('Traduction automatique')
  })

  it('should keep focus where it is when showing the source of a hovered block', async () => {
    const { target, block } = renderDocument()
    const input = document.createElement('input')
    document.body.prepend(input)
    input.focus()

    await mountStatus(target)
    block.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))

    await vi.waitFor(() => expect(document.querySelector('[data-slot="content"]')?.textContent).toContain('Hello'))
    expect(document.activeElement).toBe(input)
  })
})
