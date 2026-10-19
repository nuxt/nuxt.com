export default defineEventHandler(async (event) => {
  const sandbox = await getPreviewSandbox(getRouterParam(event, 'id')!)
  if (sandbox?.status === 'running') await sandbox.stop()
  return { stopped: Boolean(sandbox) }
})
