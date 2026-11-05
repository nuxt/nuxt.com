import { describe, expect, it, vi } from 'vitest'
import { CONFIG_DOCS_MARKER, configDocs } from '../../server/utils/content/plugins/config-docs'
import { comarkPlugins } from '../../server/utils/content/plugins'

/** Just enough of a content instance for `setup()` to register its parser. */
function setupPlugin() {
  let parser: ((file: { read: () => Promise<string>, partial?: boolean }) => Promise<{
    nodes?: unknown[]
    meta?: Record<string, unknown>
    data?: Record<string, unknown>
    partial: boolean
  } | null>) | undefined

  configDocs(comarkPlugins).setup?.({
    perf: undefined,
    logger: { warn: vi.fn() },
    addParser: (_extensions: string[], fn: never) => void (parser = fn)
  } as never)

  if (!parser) throw new Error('configDocs registered no parser')

  return parser
}

describe('configDocs', () => {
  it('parses with the chain it is handed', async () => {
    // The chain arrives as an argument, so a broken hand-off shows up as a missing `toc`.
    const parsed = await setupPlugin()({ read: async () => '# Title\n\n## Section\n' })

    expect(parsed?.nodes?.length).toBeGreaterThan(0)
    expect(parsed?.meta?.toc).toBeDefined()
    expect(parsed?.partial).toBe(false)
  })

  it('reads frontmatter only on a partial load', async () => {
    const parsed = await setupPlugin()({ read: async () => '---\ntitle: Config\n---\n\n# Body\n', partial: true })

    expect(parsed?.data?.title).toBe('Config')
    expect(parsed?.partial).toBe(true)
    expect(parsed?.nodes).toBeUndefined()
  })

  it('keeps the page when the schema cannot be generated', async () => {
    // Better a page missing its section than a 500 on the whole instance.
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 500 })))

    const parsed = await setupPlugin()({ read: async () => `# Config\n\n${CONFIG_DOCS_MARKER}\n` })

    expect(parsed?.nodes?.length).toBeGreaterThan(0)
    vi.unstubAllGlobals()
  })
})
