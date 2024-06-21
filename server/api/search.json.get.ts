import { serverQueryContent } from '#content/server'

export default eventHandler(async (event) => {

  const { select } = getQuery<{ select: string | undefined }>(event)
  const fieldsToSelect = select?.split(',') ?? []

  return await serverQueryContent(event, '/docs')
  .only(fieldsToSelect)
  .where({
    _type: 'markdown',
    _path: {
      $and: [{
        $ne: new RegExp('^/docs/bridge')
      }, {
        $ne: new RegExp('^/docs/migration')
      }]
    },
    navigation: { $ne: false }
  }).find()
})
