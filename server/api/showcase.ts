export default cachedEventHandler(() => {
  return $fetch('https://api.vuetelescope.com/lists/505')
}, {
  name: 'nuxt-showcase',
  maxAge: 60 * 1000
})
