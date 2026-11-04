export default defineCachedEventHandler(event => fetchTemplateHealth(event), {
  name: 'template-health',
  getKey: () => 'all',
  maxAge: 60 * 10,
  swr: true
})
