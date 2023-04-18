import { read } from "fs"

export default eventHandler(event => {
  const readme: any = {
    message: 'Welcome to Nuxt API',
    routes: [
      '/ping',
      '/modules?version=3',
      '/modules?version=2-bridge',
      '/modules?version=2',
      '/modules/:name',
    ]
  }
  if (process.dev) {
    readme.playground = '/__nuxt_devtools__/client/modules/server-routes'
  }
  return readme
})