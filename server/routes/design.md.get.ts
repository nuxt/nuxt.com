import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

export default defineCachedEventHandler(async (event) => {
  const domain = getSiteUrl(event)
  const content = await readFile(resolve(process.cwd(), 'content/design.md'), 'utf8')

  setResponseHeader(event, 'Content-Type', 'text/markdown; charset=utf-8')
  setResponseHeader(event, 'Link', [
    `<${domain}/design.md>; rel="canonical"`,
    `<${domain}/design-kit>; rel="alternate"; type="text/html"`
  ].join(', '))

  return content
}, {
  name: 'design-md',
  swr: true,
  maxAge: 60 * 60
})
