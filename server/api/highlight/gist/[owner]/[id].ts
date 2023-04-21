import { z, useValidatedParams, useValidatedQuery } from 'h3-zod'
import { HIGHLIGHT_LANGS } from '~/server/utils/shiki'

export default cachedEventHandler(async (event) => {
  const params = await useValidatedParams(event, {
    owner: z.string(),
    id: z.string()
  })
  const { lang } = await useValidatedQuery(event, {
    lang: z.enum(HIGHLIGHT_LANGS)
  })
  const code = await $fetch(`https://gist.githubusercontent.com/${params.owner}/${params.id}/raw`) as string

  return await highlightCode(code, lang)
}, {
  name: 'highlight/gist',
  getKey: async (event) => `${event.context.params!.owner}/${event.context.params!.id}/${getQuery(event)!.lang}`,
  swr: true,
  maxAge: 60 * 60, // 1 hour
})