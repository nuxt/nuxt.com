import { defineDynamic, defineTool } from 'eve/tools'
import { z } from 'zod'
import { resolveContext, type AuthContext } from '../lib/identity/context.js'
import { internalFetch } from '../lib/internal-api.js'

const sandboxId = z.string().min(1).describe('The sandbox id from the `Live preview:` line of the client context')

/** Edits wait for the preview's dev server to be warm and module installs run `npm`, so these calls get more time than other internal calls. */
function previewAction(action: string, input: Record<string, unknown>, auth: AuthContext | null | undefined, timeoutMs = 30_000) {
  if (resolveContext(auth).surface !== 'web' || !auth?.principalId) {
    throw new Error('Live preview editing requires a browser session.')
  }
  return internalFetch<Record<string, unknown>>('/api/internal/templates/preview', {
    method: 'POST',
    body: JSON.stringify({ ...input, action, principalId: auth.principalId }),
    signal: AbortSignal.timeout(timeoutMs)
  })
}

export default defineDynamic((ctx) => {
  if (resolveContext(ctx.session.auth.current).surface !== 'web') return null

  return {
    list_app_files: defineTool({
      description: 'List the source files of the template app running in the user\'s live preview, plus the end of its dev server log once it runs. Call it first to find where to make a change.',
      inputSchema: z.object({ sandboxId }),
      execute: (input, ctx) => previewAction('list', input, ctx.session.auth.current)
    }),
    read_app_file: defineTool({
      description: 'Read one source file of the app in the user\'s live preview.',
      inputSchema: z.object({ sandboxId, path: z.string().min(1).describe('Path relative to the app root, e.g. "app/pages/index.vue"') }),
      execute: (input, ctx) => previewAction('read', input, ctx.session.auth.current)
    }),
    edit_app_file: defineTool({
      description: 'Create, change or delete a source file of the app in the user\'s live preview. Prefer `edits` (exact find/replace pairs, each `find` must appear once) for changes to existing files, and `content` for new files or full rewrites. The preview shows the change live, without a reload. Changing nuxt.config or package.json restarts the dev server: the call returns once it is back.',
      inputSchema: z.object({
        sandboxId,
        path: z.string().min(1).describe('Path relative to the app root, e.g. "app/components/AppHeader.vue"'),
        edits: z.array(z.object({ find: z.string().min(1), replace: z.string() })).max(20).optional(),
        content: z.string().optional().describe('The full new file content'),
        delete: z.boolean().optional().describe('Delete the file instead'),
        previewPath: z.string().startsWith('/').optional().describe('The route where this change shows, e.g. "/" for content/index.md. The preview opens it when the user is on another page.')
      }),
      execute: (input, ctx) => previewAction('edit', input, ctx.session.auth.current, 150_000)
    }),
    add_app_module: defineTool({
      description: 'Install a Nuxt module in the app in the user\'s live preview with `nuxi module add`, which also registers it in nuxt.config. Use the npm name from `show_module` or `search_modules`, never a guessed one.',
      inputSchema: z.object({ sandboxId, name: z.string().min(1).describe('npm package name, e.g. "@nuxt/image"') }),
      execute: (input, ctx) => previewAction('add_module', input, ctx.session.auth.current, 300_000)
    }),
    check_app_page: defineTool({
      description: 'Load a route of the app in the user\'s live preview the way their browser would: returns the HTTP status, the text the page rendered, and recent dev server errors. Call it after your last change, before you reply.',
      inputSchema: z.object({ sandboxId, path: z.string().startsWith('/').describe('The route to load, e.g. "/"') }),
      execute: (input, ctx) => previewAction('check', input, ctx.session.auth.current, 150_000)
    })
  }
})
