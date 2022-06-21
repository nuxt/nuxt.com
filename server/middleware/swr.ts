
export default eventHandler((event) => {
  if (process.env.NODE_ENV === 'production') {
  // Cache like static assets, invalidate after new deployment
    if (event.req.url.startsWith('/api/_content/')) {
    // Cache for 7 days
      event.res.setHeader('Cache-Control', 'public, max-age=604800, s-max-age=604800, stale-while-revalidate')
    }
  }
})
