import type { MarkdownDocument } from 'comark'

export type Release = {
  url: string
  repo: string
  tag: string
  title: string
  date: string
  markdown: string
  /** Parsed release notes, rendered with `<MarkdownDocument :value="release.body" />`. */
  body: MarkdownDocument
}
