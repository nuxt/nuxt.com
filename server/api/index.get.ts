export default eventHandler(() => {
  const readme: any = {
    message: 'Welcome to Nuxt API',
    routes: [
      '/ping',
      '/modules?version=3',
      '/modules?version=2-bridge',
      '/modules?version=2',
      '/modules?category=ui',
      '/modules?version=3&category=ui',
      '/modules/:name',
      '/modules/categories?version=3',
      '/contributors',
      '/sponsors',
      '/showcase',
      '/jobs',
      '/support/contact',
      '/teams/core',
      '/teams/ecosystem'
    ]
  }
  if (import.meta.dev) {
    readme.playground = '/__nuxt_devtools__/client/modules/server-routes'
  }
  return readme
})
