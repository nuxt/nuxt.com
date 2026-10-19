export default defineEventHandler(async (event) => {
  const owner = await getRateLimitPrincipalId(event)
  const sandbox = owner ? await getPreviewSandbox(getRouterParam(event, 'id')!, owner) : null
  if (sandbox?.status === 'running') await sandbox.stop()
  return { stopped: Boolean(sandbox) }
})
