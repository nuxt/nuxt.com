
export default eventHandler((event) => {
  if (process.env.NODE_ENV === 'production') {
  // Cache like static assets, invalidate after new deployment
    if (event.req.url.startsWith('/api/_content/')) {
    // Cache for 1 hour
      event.res.setHeader('Cache-Control', 'public,max-age=3600,s-max-age=3600,stale-while-revalidate=1')
    }
  }
})
