/**
 * Check templates from the terminal: `pnpm templates:check` (needs `pnpm dev` running).
 * - `--payload '{"slugs":["minimal","docus"]}'` checks some of them.
 * - `--payload '{"failing":true}'` checks the ones that don't pass.
 * - `--payload '{"baseURL":"http://localhost:3001"}'` when the dev server runs on another port.
 */
export default defineTask({
  meta: {
    name: 'templates:check',
    description: 'Install, build and start templates in Vercel Sandbox and record the results'
  },
  async run({ payload }) {
    const result = await startTemplateChecks(typeof payload?.baseURL === 'string' ? payload.baseURL : 'http://localhost:3000', {
      slugs: Array.isArray(payload?.slugs) ? payload.slugs.map(String) : undefined,
      failing: payload?.failing === true,
      trigger: 'task'
    })
    return { result }
  }
})
