import { defineEventHandler, setResponseStatus } from 'h3'

const assetExtensions = new Set(['jpg', 'jpeg', 'png', 'gif', 'svg', 'ico', 'webp', 'avif', 'woff', 'woff2', 'ttf', 'eot', 'otf'])

export default defineEventHandler((event) => {
  if (event.path.includes('__og-image__')) {
    return
  }
  // if path has an asset extension, return 404
  const dotIndex = event.path.lastIndexOf('.')
  if (dotIndex !== -1 && assetExtensions.has(event.path.slice(dotIndex + 1))) {
    setResponseStatus(event, 404)
    return 'Image not found'
  }
})
