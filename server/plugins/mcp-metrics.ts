import { metric } from '@vercel/functions'

/**
 * One `mcp.tool.duration_ms` sample per tool call, cache hits included, tagged by `toolName` and
 * `outcome`. Count the samples for call volume, percentiles for latency, and group by `outcome`
 * for errors.
 */
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('mcp:tool:called', ({ name, result, durationMs }) => {
    metric('mcp.tool.duration_ms', Math.round(durationMs), {
      toolName: name,
      outcome: result.isError ? 'error' : 'success'
    })
  })
})
