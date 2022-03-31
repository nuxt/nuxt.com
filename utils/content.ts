export const findChildFromPath = (slug, tree) => {
  for (const file of tree) {
    if (file.slug === slug) {
      return file
    }
    if (file.children) {
      const result = findChildFromPath(slug, file.children)
      if (result) { return result }
    }
  }
}

export const findBottomLinkFromTree = (link) => {
  let slug = link.slug

  if (link.children && link.children.length) {
    slug = findBottomLinkFromTree(link.children[0])
  }

  return slug
}
