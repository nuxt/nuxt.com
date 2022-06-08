export default defineCachedEventHandler(() => {
  return $fetch<{ data: any, errors: any }>('https://modules.nuxtjs.org/api/modules')
}, {
  name: 'modules',
  maxAge: 60 * 1000
})
