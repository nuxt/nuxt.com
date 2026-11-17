import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { h, nextTick } from 'vue'
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

beforeAll(async () => {
  await import('~/components/DocsL10nEditor.vue')
})

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

describe('DocsL10nStatus review mode clicks', () => {
  function renderComponents() {
    const target = document.createElement('div')
    target.innerHTML = [
      `<p data-l10n="machine" data-l10n-hash="${HASH}">Bonjour <a href="/fr/docs/4.x/guide" data-inline>le guide</a></p>`,
      `<div data-callout><a href="/fr/docs/4.x/guide/concepts/rendering"><span data-overlay></span></a><span data-l10n="machine" data-l10n-hash="${HASH}">Modes de rendu</span></div>`,
      `<div data-l10n="machine" data-l10n-hash="${HASH}"><button type="button" data-toggle>Afficher</button></div>`
    ].join('')
    document.body.append(target)
    return target
  }

  async function click(element: Element) {
    const event = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 })
    element.dispatchEvent(event)
    await nextTick()
    return event
  }

  it('should open the editor from a link in a block or the overlay link of a callout, without following it', async () => {
    const target = renderComponents()
    await mountStatus(target)

    for (const selector of ['[data-inline]', '[data-overlay]']) {
      const event = await click(target.querySelector(selector)!)
      expect(event.defaultPrevented).toBe(true)
    }
    await vi.waitFor(() => expect(document.querySelector('[role="dialog"]')).not.toBeNull())
  })

  it('should keep the action of a control in a block', async () => {
    const target = renderComponents()
    await mountStatus(target)
    const toggle = target.querySelector<HTMLButtonElement>('[data-toggle]')!
    const clicked = vi.fn()
    toggle.addEventListener('click', clicked)

    const event = await click(toggle)
    expect(event.defaultPrevented).toBe(false)
    expect(clicked).toHaveBeenCalled()
  })
})
