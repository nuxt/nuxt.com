import { parseContent } from '#content/server'

const DEFAULT_MD = `
# Editor Playground

Welcome to the **editor** playground.
`

export default defineEventHandler(async () => {
  const storage = useStorage()
  const id = 'db:markdown.md'

  if (!(await storage.hasItem(id))) {
    await storage.setItem(id, DEFAULT_MD)
  }
  const markdown = await storage.getItem(id)
  const parsedMarkdown = await parseContent(id, markdown)

  return {
    markdown,
    parsedMarkdown
  }
})
