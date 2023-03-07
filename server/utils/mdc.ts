// @ts-ignore
import mdTransformer from '@nuxt/content/transformers/markdown'
// @ts-ignore
import shikiTransformer from '@nuxt/content/transformers/shiki/shiki'

export async function parseMarkdown (body: string, name: string = '') {
  const parsed = await mdTransformer.parse(name, body, {})

  await highlight(parsed)

  return parsed
}

export async function highlight(parsed: any) {
  await shikiTransformer.transform(parsed, {
    preload: ['js', 'ts', 'md', 'vue'],
    theme: {
      default: 'github-light',
      dark: 'github-dark'
    }
  })
}