/**
 * Check templates from the terminal: `pnpm templates:check` (needs `pnpm dev` running).
 * - `--payload '{"slugs":["minimal","docus"]}'` checks some of them.
 * - `--payload '{"failing":true}'` checks the ones that don't pass.
 */
export default defineTask({
  meta: {
    name: 'templates:check',
    description: 'Install, build and start templates in Vercel Sandbox and record the results'
  },
  async run({ payload }) {
    const result = await startTemplateChecks({
      slugs: Array.isArray(payload?.slugs) ? payload.slugs.map(String) : undefined,
      failing: payload?.failing === true,
      trigger: 'task'
    })
    return { result }
  }
})
