import { Renderer } from '@takumi-rs/core'
import type { Node } from '@takumi-rs/core'
import type { OgImageRenderEventContext } from '#og-image/types'
import { loadFontsForRenderer, parseUnicodeRange } from '#og-image/server/og-image/fonts'
import { findTemplateOgNode, layoutTemplateOg } from '../utils/template-og'

declare module 'nitropack/types' {
  interface NitroRuntimeHooks {
    'nuxt-og-image:takumi:nodes': (node: Node, event: OgImageRenderEventContext) => Promise<void>
  }
}

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('nuxt-og-image:takumi:nodes', async (node, event) => {
    if (!findTemplateOgNode(node, 'template-og-detail')) return
    const fonts = await loadFontsForRenderer(event, { supportedFormats: new Set(['ttf', 'otf', 'woff', 'woff2']), component: event.options.component })
    const renderer = new Renderer()
    for (const font of fonts) {
      const data = font.data instanceof ArrayBuffer ? new Uint8Array(font.data) : new Uint8Array(font.data.buffer, font.data.byteOffset, font.data.byteLength)
      await renderer.registerFont({ name: font.originalFamily || font.family, weight: font.weight, style: font.style, data, unicodeRange: font.unicodeRange ? parseUnicodeRange(font.unicodeRange) ?? undefined : undefined })
    }
    await layoutTemplateOg(renderer, node)
  })
})
