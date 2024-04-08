export default eventHandler(async (event) => {
  return {
    version: await getNuxtVersion(event)
  }
})
