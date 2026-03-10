import type { MDCRoot } from '@nuxtjs/mdc'

export type Release = {
  url: string
  repo: string
  tag: string
  title: string
  date: string
  markdown: string
  body: MDCRoot
}
