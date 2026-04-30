import type { H3Event } from 'h3'

declare module 'h3' {
  interface H3EventContext {
    /** Set to `true` by `requireMcpAdminToken` once a request is authenticated for the admin MCP handler. */
    mcpAdmin?: boolean
  }
}

/**
 * Validates a Bearer token against `runtimeConfig.mcpAdminToken` and marks
 * the H3 event as authenticated for the admin MCP handler.
 *
 * Used both by the `/mcp/admin` handler middleware (to gate the whole handler)
 * and indirectly by admin tools (via the `enabled` guard checking
 * `event.context.mcpAdmin === true`).
 */
export function requireMcpAdminToken(event: H3Event): void {
  const config = useRuntimeConfig(event)
  if (!config.mcpAdminToken) {
    throw createError({ statusCode: 503, statusMessage: 'MCP admin authentication is not configured' })
  }

  const auth = getHeader(event, 'authorization')
  if (auth !== `Bearer ${config.mcpAdminToken}`) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  event.context.mcpAdmin = true
}

export function isMcpAdmin(event: H3Event): boolean {
  return event.context.mcpAdmin === true
}
