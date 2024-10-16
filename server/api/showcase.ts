export default cachedEventHandler((event) => {
  return sendRedirect(event, '/showcase.json')
})
