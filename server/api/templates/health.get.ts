export default defineEventHandler((event) => {
  // Repository metadata is cached separately; build results must reflect a finished recheck immediately.
  setResponseHeader(event, 'cache-control', 'no-store')
  return fetchTemplateHealth(event)
})
