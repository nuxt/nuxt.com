export default cachedEventHandler((event) => {
  if (process.env.NODE_ENV === 'production') {
    // Cache like static assets, invalidate after new deployment
    if (event.req.url.startsWith('/api/_content/')) {
      event.res.setHeader('Cache-Control', 'public,max-age=31536000,immutable')
    }
  }
})
