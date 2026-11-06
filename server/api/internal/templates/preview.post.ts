import { z } from 'zod'

const target = { sandboxId: z.string().min(1), principalId: z.string().min(1) }

const bodySchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('list'), ...target }),
  z.object({ action: z.literal('read'), ...target, path: z.string().min(1) }),
  z.object({
    action: z.literal('edit'),
    ...target,
    path: z.string().min(1),
    content: z.string().max(200_000).optional(),
    edits: z.array(z.object({ find: z.string().min(1), replace: z.string() })).max(20).optional(),
    delete: z.boolean().optional()
  }),
  z.object({ action: z.literal('add_module'), ...target, name: z.string().min(1) }),
  z.object({ action: z.literal('check'), ...target, path: z.string().min(1).max(300) })
])

function applyEdits(content: string, edits: { find: string, replace: string }[], path: string) {
  return edits.reduce((current, { find, replace }) => {
    const index = current.indexOf(find)
    if (index === -1) throw createError({ statusCode: 422, message: `Text to replace not found in ${path}: ${find.slice(0, 120)}` })
    if (current.includes(find, index + 1)) throw createError({ statusCode: 422, message: `Text to replace appears more than once in ${path}, include more context: ${find.slice(0, 120)}` })
    return current.slice(0, index) + replace + current.slice(index + find.length)
  }, content)
}

/** Lets Nuxi read and change the code of a live template preview, for the visitor who started it. */
export default defineEventHandler(async (event) => {
  requireInternalRequest(event)
  const body = await readValidatedBody(event, bodySchema.parse)
  const sandbox = await getPreviewSandbox(body.sandboxId, body.principalId)
  if (sandbox?.status !== 'running') {
    throw createError({ statusCode: 404, message: 'No live preview with this id is open for this user.' })
  }

  switch (body.action) {
    case 'list':
      return { files: await listAppFiles(sandbox), devServerLog: await devServerLog(sandbox) || undefined }

    case 'read': {
      const file = await readAppFile(sandbox, body.path)
      if (!file) throw createError({ statusCode: 404, message: `${body.path} does not exist.` })
      return file
    }

    case 'edit': {
      // Edits only show once the page runs `nuxt dev`: the page starts it too, and both wait for the same server.
      await waitForDevServer(sandbox)
      const file = resolveAppPath(body.path).path
      const restarts = RESTARTING_FILES.test(file)
      const content = file.startsWith('content/')
      const offset = restarts || content ? await devLogSize(sandbox) : 0
      let path: string
      if (body.delete) {
        path = await deleteAppFile(sandbox, body.path)
      } else {
        let text = body.content
        if (body.edits?.length) {
          const current = await readAppFile(sandbox, body.path)
          if (!current) throw createError({ statusCode: 404, message: `${body.path} does not exist, pass the full content to create it.` })
          if (current.truncated) throw createError({ statusCode: 422, message: `${body.path} is too large to edit.` })
          text = applyEdits(current.content, body.edits, current.path)
        }
        if (text === undefined) throw createError({ statusCode: 400, message: 'Pass either content or edits.' })
        path = await writeAppFile(sandbox, body.path, text)
      }
      if (restarts) await waitForRestart(sandbox, offset)
      else if (content) await waitForContent(sandbox, offset)
      return { path, ...(body.delete && { deleted: true }), ...(restarts && { restarted: true }) }
    }

    case 'add_module': {
      await waitForDevServer(sandbox)
      const result = await addAppModule(sandbox, body.name)
      return { ok: result.exitCode === 0, output: result.output }
    }

    case 'check':
      await waitForDevServer(sandbox)
      return await checkAppPage(sandbox, body.path)
  }
})
