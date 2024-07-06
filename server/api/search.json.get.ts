import { serverQueryContent } from '#content/server'

export default eventHandler(async (event) => {
  const { select } = getQuery<{ select: string | undefined }>(event)

  const docs = await serverQueryContent(event, '/docs').where({
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

  if (select.length) {
    const fieldsToSelect = select.split(',') ?? []
    return docs.map((doc) => {
      return fieldsToSelect.reduce((acc, field) => {
        if (doc[field] !== undefined) {
          acc[field] = doc[field]
        }
        return acc
      }, {})
    })
  }
  else {
    return docs
  }
})
