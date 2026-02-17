import { kebabCase } from 'scule'

export function getWebsiteScreenShotUrl(website: any) {
  return `/assets/websites/${kebabCase(website.name?.replace(/[^a-z0-9]/gi, ''))}.webp`
}
