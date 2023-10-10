import { serverQueryContent } from '#content/server'

export default eventHandler(async (event) => {
  return serverQueryContent(event, '/docs').where({ _type: 'markdown', navigation: { $ne: false } }).find()
})
