import { useBody } from 'h3'
import { parseContent } from '#content/server'

const storage = useStorage()

export default defineEventHandler(async (event) => {
  const body = await useBody(event)
  const id = 'db:markdown.md'

  await storage.setItem(id, body.content)

  return await parseContent(id, body.content)
})
