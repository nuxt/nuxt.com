export default cachedEventHandler((event) => {
  if (process.env.NODE_ENV === 'production' && event.req.url.startsWith('/api/_content/')) {
    event.res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate=59')
  }
})
