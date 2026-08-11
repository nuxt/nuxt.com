import type { Toc } from 'comark/plugins/toc'

/**
 * Navigation item shape consumed by Nuxt UI content components and site helpers.
 * Compatible with Comark's NavigationItem plus optional Nuxt Content extras.
 */
export interface ContentNavigationItem {
  title: string
  path?: string
  stem?: string
  description?: string
  children?: ContentNavigationItem[]
  page?: false
  titleTemplate?: string
  [key: string]: unknown
}

/**
 * Flattened page shape used by site templates (mirrors former Nuxt Content items).
 * Frontmatter fields are spread onto the root; the Comark document lives in `document`.
 */
export interface SitePage<T extends Record<string, any> = Record<string, any>> {
  path: string
  stem: string
  extension: string
  title?: string
  description?: string
  seo?: {
    title?: string
    description?: string
  }
  /** Present when the document has a TOC (from Comark toc plugin). */
  body?: {
    toc?: Toc
  }
  /** Parsed Comark nodes — pass to MarkdownDocument as `{ nodes, frontmatter }`. */
  nodes: unknown[]
  /** Ready-to-render MarkdownDocument value. */
  document: {
    nodes: unknown[]
    frontmatter: T
    meta?: Record<string, unknown>
  }
  [key: string]: unknown
}
