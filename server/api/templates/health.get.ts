export default defineCachedEventHandler(event => fetchTemplateHealth(event), {
  name: 'template-health',
  maxAge: 60 * 10,
  swr: true
})
