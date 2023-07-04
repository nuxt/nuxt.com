// @ts-ignore
import mdTransformer from '@nuxt/content/transformers/markdown'

export async function parseMarkdown (body: string, name: string = '') {
  const parsed = await mdTransformer.parse(name, body, {})

  return parsed
}
