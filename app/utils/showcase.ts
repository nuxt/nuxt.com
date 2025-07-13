import { kebabCase } from 'scule'

export function getWebsiteScreenShotUrl(website: any) {
  return `/assets/websites/${kebabCase(website.name?.replace(/ /g, ''))}.png`
}
