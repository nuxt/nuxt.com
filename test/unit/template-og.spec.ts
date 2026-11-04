import { Renderer } from '@takumi-rs/core'
import type { Node } from '@takumi-rs/core'
import { describe, expect, it } from 'vitest'
import { fitTemplateOgCopy, layoutTemplateOg } from '../../server/utils/template-og'

const renderer = new Renderer()

describe('template social image copy', () => {
  it.each([
    'Dashboard',
    'A complete Nuxt dashboard for managing projects, customers, billing and team collaboration',
    'AnUnbrokenTemplateName'.repeat(20),
    '日本語のテンプレート '.repeat(20)
  ])('keeps the heading clear of the wordmark and preview: %s', async (name) => {
    const fitted = await fitTemplateOgCopy(renderer, name, { width: 880, maxHeight: 168, maxSize: 88, minSize: 56, family: 'Outfit', lineHeight: 1.06, letterSpacing: -2.1 })
    expect(fitted.fits).toBe(true)
    expect(fitted.height).toBeLessThanOrEqual(168)
    if (name === 'Dashboard') expect(fitted.text).toBe(name)
  })

  it('bounds long descriptions without splitting a trailing word', async () => {
    const description = 'A template for managing projects and collaborating with your team. '.repeat(20)
    const fitted = await fitTemplateOgCopy(renderer, description, { width: 1000, maxHeight: 72, maxSize: 25 })
    expect(fitted.fits).toBe(true)
    expect(fitted.text.endsWith('…')).toBe(true)
    expect(description).toContain(fitted.text.slice(0, -1))
    expect(description[fitted.text.length - 1]).toMatch(/[\s.,;]/)
  })

  it('moves the preview and its metadata below long copy together', async () => {
    const text = (tw: string, value: string): Node => ({ type: 'text', tw, text: value })
    const heading = text('template-og-heading', 'A very long template name for building a complete application with Nuxt and managing customers')
    const summary = text('template-og-summary', 'A complete application with many useful features for teams. '.repeat(20))
    const credit = text('template-og-credit', 'a-community-organization/a-template-repository')
    const meta: Node = { type: 'container', tw: 'template-og-meta' }
    const preview: Node = { type: 'container', tw: 'template-og-preview' }
    await layoutTemplateOg(renderer, { type: 'container', children: [heading, summary, credit, meta, preview] })
    expect(Number(summary.style?.top) + Number(summary.style?.height) + 40).toBeLessThanOrEqual(Number(preview.style?.top))
    expect(meta.style?.top).toBe(preview.style?.top)
    expect(Number(credit.style?.top)).toBeGreaterThan(Number(meta.style?.top))
    expect(Number(preview.style?.top)).toBeLessThan(400)
  })
})
