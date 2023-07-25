import { splitByCase, upperFirst } from 'scule'

export const createBreadcrumb = (link: string) => {
  if (link.startsWith('http')) {
    return link
  }
  return link.split('/').filter(Boolean).map(part => splitByCase(part).map(p => upperFirst(p)).join(' ')).join(' > ').replace('Api', 'API')
}
