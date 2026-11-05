import { kebabCase } from 'scule'

function getWebsiteSlug(website: any) {
  return kebabCase(website.name?.replace(/[^a-z0-9]/gi, ''))
}

export function getWebsiteScreenShotUrl(website: any) {
  return `/assets/websites/${getWebsiteSlug(website)}.webp`
}

export function getWebsiteLogoUrl(website: any) {
  return `/assets/websites/logos/${getWebsiteSlug(website)}.svg`
}
