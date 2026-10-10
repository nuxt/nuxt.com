export default defineEventHandler(async (event) => {
  const username = getRouterParam(event, 'username')
  if (!username || !/^[a-z0-9-]{1,39}$/i.test(username)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid GitHub username' })
  }

  const nuxter = await nuxters.get(username)
  if (!nuxter) {
    throw createError({ statusCode: 404, statusMessage: 'Nuxter not found' })
  }

  setResponseHeader(event, 'cache-control', 'public, max-age=0, s-maxage=600, stale-while-revalidate=3600')
  return nuxter
})
