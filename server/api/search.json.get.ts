import { serverQueryContent } from '#content/server'

export default eventHandler(async (event) => {
  let files = await serverQueryContent(event, '/docs').where({
    _type: 'markdown',
    navigation: { $ne: false }
  }).find()

  files = files.filter(file => !file._path.startsWith('/docs/bridge') && !file._path.startsWith('/docs/migration'))

  return files
})
