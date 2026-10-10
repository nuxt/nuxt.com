/**
 * Import the latest nuxt/nuxters period files into the local database:
 * `pnpm nuxters:sync` (needs `pnpm dev` running).
 * - `--payload '{"force":true}'` re-imports unchanged files.
 * - `--payload '{"dir":"/path/to/nuxters/public"}'` imports a local collector output instead of GitHub.
 */
export default defineTask({
  meta: {
    name: 'nuxters:sync',
    description: 'Import the period files of nuxt/nuxters into the nuxters table'
  },
  async run({ payload }) {
    const result = await syncNuxters({
      sha: typeof payload?.sha === 'string' ? payload.sha : undefined,
      force: payload?.force === true,
      dir: typeof payload?.dir === 'string' ? payload.dir : undefined
    })
    return { result }
  }
})
