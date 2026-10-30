import type { H3Event } from 'h3'

export function validateMcpAdminToken(token: string, event: H3Event): boolean {
  const { mcpAdminToken } = useRuntimeConfig(event)
  return Boolean(mcpAdminToken) && token === mcpAdminToken
}
