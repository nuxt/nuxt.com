import { serverQueryContent } from '#content/server'


export default defineCachedEventHandler(async (event) => {
  const list = await serverQueryContent(event, '/templates').only('templates').findOne()
  return list.templates
})
