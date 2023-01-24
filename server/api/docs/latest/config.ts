import mdTransformer from '@nuxt/content/transformers/markdown'

export default defineEventHandler(async () => {
  const raw = await $fetch('https://unpkg.com/@nuxt/schema-edge/schema/config.md')
  const parsed = await mdTransformer.parse('config.md', raw, {})

  parsed.excerpt = {}

  return parsed
})
