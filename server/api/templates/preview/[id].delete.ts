export default defineEventHandler(async (event) => {
  const owner = await getRateLimitPrincipalId(event)
  const id = getRouterParam(event, 'id')!
  const sandbox = owner ? await getPreviewSandbox(id, owner) : null
  if (sandbox?.status === 'running') await sandbox.stop()
  if (sandbox) await releasePreview(owner!, id)
  return { stopped: Boolean(sandbox) }
})
