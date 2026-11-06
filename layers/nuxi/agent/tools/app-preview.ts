import { defineDynamic, defineTool } from 'eve/tools'
import { z } from 'zod'
import { resolveContext, type AuthContext } from '../lib/identity/context.js'
import { internalFetch } from '../lib/internal-api.js'

export const APP_PREVIEW_INSTRUCTIONS = `**Live preview — web chat only:** A \`Live preview:\` line in the client context means the user is running a template in a sandbox, and you can change its code with \`list_app_files\`, \`read_app_file\`, \`edit_app_file\`, \`add_app_module\` and \`check_app_page\`, using the sandbox id from that line. When they ask for a change without naming another project, they mean this app: make it yourself.
- The \`Live preview page:\` line is the page on their screen, and the default target of every request. A bare phrase or a short ask ("Hello world", "make it blue", "add a pricing section") means: change that page. Find the file that renders that route (\`app/pages/…\` or \`pages/…\`, \`app.vue\` when there are no pages, \`content/…\` for Nuxt Content) and edit it. Never ask which app or page they mean.
- List the files first and read a file before editing it. Keep \`edits\` small and exact, and follow the conventions already in the code. If an edit times out, read the file again before retrying: the change may already have been applied. Pages can come from a layer (Docus renders every page from \`content/\`): change the file that exists, and never create \`app/\` in an app without one.
- Install modules with \`add_app_module\` and a real npm name from \`show_module\` or \`search_modules\`, then finish the module's setup before using it: for \`@nuxt/ui\`, a CSS file with \`@import "tailwindcss";\` and \`@import "@nuxt/ui";\` listed in \`css\` in \`nuxt.config.ts\`, and the app wrapped in \`<UApp>\`.
- Changes show in the preview live. The first edit waits for the preview's dev server to start, which can take a minute: the user sees it starting. A \`Live preview page:\` line is the route the user is looking at: "this page" means that route. When an edit shows on another route, pass it as \`previewPath\` so the preview opens it. A \`Live preview error:\` line is an error the app threw since: fix it.
- After your last change, call \`check_app_page\` on the page you changed. A status other than 200, missing text you added, or a dev server error means it doesn't work yet: fix it and check again. Never say a change is done before the check shows it.
- Reply in a sentence or two with what you changed on which page, e.g. "The home page now says Hello world." Talk about the page, not "the application". Do **not** offer \`show_prompt\` for these changes unless the user asks how to apply them to their own project.`

type PreviewAction = 'list' | 'read' | 'edit' | 'add_module' | 'check'

function browserPrincipal(auth: AuthContext | null | undefined) {
  return resolveContext(auth).surface === 'web' ? auth?.principalId : undefined
}

const sandboxId = z.string().min(1).describe('The sandbox id from the `Live preview:` line of the client context')

/** The API checks ownership. Longer timeouts cover startup followed by file work, installation or restart in the same request. */
function callPreview(action: PreviewAction, input: Record<string, unknown>, auth: AuthContext | null | undefined, timeoutMs = 30_000) {
  const principalId = browserPrincipal(auth)
  if (!principalId) {
    throw new Error('Live preview editing requires a browser session.')
  }
  return internalFetch<Record<string, unknown>>('/api/internal/templates/preview', {
    method: 'POST',
    body: JSON.stringify({ ...input, action, principalId }),
    signal: AbortSignal.timeout(timeoutMs)
  })
}

export default defineDynamic((ctx) => {
  if (!browserPrincipal(ctx.session.auth.current)) return null

  return {
    list_app_files: defineTool({
      description: 'List the source files of the template app running in the user\'s live preview, plus the end of its dev server log once it runs. Call it first to find where to make a change.',
      inputSchema: z.object({ sandboxId }),
      execute: (input, ctx) => callPreview('list', input, ctx.session.auth.current)
    }),
    read_app_file: defineTool({
      description: 'Read one source file of the app in the user\'s live preview.',
      inputSchema: z.object({ sandboxId, path: z.string().min(1).describe('Path relative to the app root, e.g. "app/pages/index.vue"') }),
      execute: (input, ctx) => callPreview('read', input, ctx.session.auth.current)
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
      execute: (input, ctx) => callPreview('edit', input, ctx.session.auth.current, 420_000)
    }),
    add_app_module: defineTool({
      description: 'Install a Nuxt module in the app in the user\'s live preview with `nuxi module add`, which also registers it in nuxt.config. Use the npm name from `show_module` or `search_modules`, never a guessed one.',
      inputSchema: z.object({ sandboxId, name: z.string().min(1).describe('npm package name, e.g. "@nuxt/image"') }),
      execute: (input, ctx) => callPreview('add_module', input, ctx.session.auth.current, 600_000)
    }),
    check_app_page: defineTool({
      description: 'Load a route of the app in the user\'s live preview the way their browser would: returns the HTTP status, the text the page rendered, and recent dev server errors. Call it after your last change, before you reply.',
      inputSchema: z.object({ sandboxId, path: z.string().startsWith('/').describe('The route to load, e.g. "/"') }),
      execute: (input, ctx) => callPreview('check', input, ctx.session.auth.current, 300_000)
    })
  }
})
