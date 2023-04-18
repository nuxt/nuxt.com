export default eventHandler(event => {
  // Make sure Nitro sends back JSON for routes/
  event.node.req.headers.accept = 'application/json'
})