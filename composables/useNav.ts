export const formatDocsNav = (links) => {
  // remove bridge and migration from /docs
  return links?.filter(link => !['/docs/migration', '/docs/bridge'].includes(link._path)).map((link) => {
    // Redirect to Github for Releases
    if (link.title === 'Community') {
      link.children.map((child) => {
        if (child.title === 'Releases') {
          child.redirect = 'https://github.com/nuxt/nuxt/releases'
        }
        return child
      })
    }
    return link
  })
}
