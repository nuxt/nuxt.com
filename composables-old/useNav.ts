import type { NavItem } from '@nuxt/content/dist/runtime/types'

export const formatDocsNav = (links: NavItem[]) => {
  // remove bridge and migration from /docs
  return links?.filter((link: NavItem) => !['/docs/migration', '/docs/bridge'].includes(link._path)).map((link) => {
    // Redirect to Github for Releases
    if (link.title === 'Community') {
      link?.children?.map((child: NavItem) => {
        if (child.title === 'Releases') {
          child.redirect = 'https://github.com/nuxt/nuxt/releases'
        }
        return child
      })
    }
    return link
  })
}
