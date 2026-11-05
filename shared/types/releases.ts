import type { MarkdownDocument } from 'comark'

export type Release = {
  url: string
  repo: string
  tag: string
  title: string
  date: string
  markdown: string
  nodes: MarkdownDocument['nodes']
}

/** A major or minor release of Nuxt or an official module, as listed on the Updates page. */
export interface NotableRelease {
  url: string
  repo: string
  /** Product name used in blog titles, e.g. `Nuxt UI` */
  product: string
  version: string
  date: string
  kind: 'major' | 'minor'
  /** Sub-headings of the release notes' Highlights section */
  highlights: string[]
}
