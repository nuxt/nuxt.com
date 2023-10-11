import { serverQueryContent } from '#content/server'

export default eventHandler(async (event) => {
  return await serverQueryContent(event, '/docs').where({
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
