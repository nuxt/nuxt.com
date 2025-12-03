export default cachedEventHandler(async () => {
  return $fetch('https://nuxters.nuxt.com/contributors.json')
}, {
  name: 'contributors',
  swr: true,
  maxAge: 60 * 5 // 5 minutes
})
