/**
 * Raw markdown mirror of every page: `/raw/<page path>.md`.
 */
export default defineEventHandler(async (event) => {
  const slug = getRouterParams(event)['slug.md']
  if (!slug?.endsWith('.md')) {
    return notFoundMarkdown(event, event.path)
  }

  const path = pagePathFromRawSlug(slug)
  const content = await getInstanceAtHead(instanceFromPagePath(path))

  const markdown = await renderPageMarkdown(content, path)
  if (markdown) {
    setHeader(event, 'Content-Type', 'text/markdown; charset=utf-8')
    setHeader(event, 'Vary', 'Accept, User-Agent')
    return markdown
  }

  // A directory without an index page (e.g. `/raw/docs/4.x/getting-started.md`) goes to the mirror
  // of its first navigation page, as the HTML pages do.
  const firstLeaf = findFirstLeaf(await content.navigation(), path)
  if (firstLeaf) {
    return sendRedirect(event, rawUrlForPage(firstLeaf), 302)
  }

  return notFoundMarkdown(event, path)
})
